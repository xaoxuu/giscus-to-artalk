const { GraphQLClient, gql } = require('graphql-request');
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

const config = require('../config.js');

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const REPO_OWNER = config.repo_owner;
const REPO_NAME = config.repo_name;
const CATEGORY_NAME = config.category_name;
const MAPPING = config.mapping || 'pathname';
const OUTPUT_FILE = config.output_file || 'giscus.artrans';

const AUTHOR_EMAIL_MAP = config.author_email_map || {};
const AUTHOR_LINK_MAP = config.author_link_map || {};
const AUTHOR_ALIAS_MAP = config.author_alias_map || {};
const PATHNAME_REWRITE = config.pathname_rewrite || {};
const PAGE_TITLE_MAP = config.page_title_map || {};
const PAGE_FILTER = config.page_filter || null;

if (!GITHUB_TOKEN || !REPO_OWNER || !REPO_NAME || !CATEGORY_NAME) {
  console.error('Missing required GITHUB_TOKEN or config.js fields.');
  process.exit(1);
}

const graphql = new GraphQLClient('https://api.github.com/graphql', {
  headers: {
    Authorization: `bearer ${GITHUB_TOKEN}`,
  },
});

const userCache = {};

async function getUserEmail(login) {
  if (AUTHOR_EMAIL_MAP[login]) return AUTHOR_EMAIL_MAP[login];
  if (userCache[login]) return userCache[login];
  const res = await fetch(`https://api.github.com/users/${login}`, {
    headers: { Authorization: `Bearer ${GITHUB_TOKEN}` },
  });
  const data = await res.json();
  const email = data.email || `${login}@users.noreply.github.com`;
  userCache[login] = email;
  return email;
}

const discussionsQuery = gql`
  query GetDiscussions($owner: String!, $name: String!, $after: String) {
    repository(owner: $owner, name: $name) {
      discussions(first: 50, after: $after) {
        pageInfo { hasNextPage endCursor }
        nodes {
          number
          title
          category { name }
        }
      }
    }
  }
`;

async function fetchDiscussions(after = null, collected = []) {
  const variables = { owner: REPO_OWNER, name: REPO_NAME, after };
  const data = await graphql.request(discussionsQuery, variables);
  const discussions = data.repository.discussions.nodes;
  collected.push(...discussions);
  const pageInfo = data.repository.discussions.pageInfo;
  if (pageInfo.hasNextPage) {
    return fetchDiscussions(pageInfo.endCursor, collected);
  }
  return collected;
}

async function fetchCommentsByRest(discussionNumber) {
  const comments = [];
  let page = 1;
  while (true) {
    const res = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/discussions/${discussionNumber}/comments?per_page=100&page=${page}`, {
      headers: { Authorization: `Bearer ${GITHUB_TOKEN}` },
    });
    const batch = await res.json();
    if (batch.length === 0) break;
    comments.push(...batch);
    page++;
  }
  return comments;
}

(async () => {
  const discussions = (await fetchDiscussions()).filter(
    d => d.category?.name === CATEGORY_NAME
  );

  const rawComments = [];

  for (const discussion of discussions) {
    const pageKeyRaw = extractPageKey(discussion.title);
    if (PAGE_FILTER && !PAGE_FILTER.includes(pageKeyRaw)) continue;

    const pageKey = PATHNAME_REWRITE[pageKeyRaw] || pageKeyRaw;
    const pageTitle = PAGE_TITLE_MAP[pageKeyRaw] || "";

    const comments = await fetchCommentsByRest(discussion.number);
    for (const comment of comments) {
      const login = comment.user?.login || 'Anonymous';
      const nick = AUTHOR_ALIAS_MAP[login] || login;
      const email = await getUserEmail(login);
      const link = AUTHOR_LINK_MAP[login] || comment.user?.html_url || '';

      rawComments.push({
        id: Number(comment.id),
        _replyId: comment.parent_id ? String(comment.parent_id) : null,
        created_at: comment.created_at,
        content: comment.body || '',
        page_key: pageKey,
        page_title: pageTitle,
        nick,
        link,
        email,
      });
    }
  }

  const commentIdMap = new Map();
  rawComments.forEach(c => {
    commentIdMap.set(String(c.id), c.id);
  });

  const artalkComments = rawComments.map(c => {
    let resolvedRid = 0;
    if (c._replyId && commentIdMap.has(c._replyId)) {
      resolvedRid = commentIdMap.get(c._replyId);
    }
    return {
      id: c.id,
      page_key: c.page_key,
      page_title: c.page_title,
      content: c.content,
      created_at: c.created_at,
      nick: c.nick,
      link: c.link,
      email: c.email,
      rid: resolvedRid,
    };
  });

  const outputPath = path.resolve(OUTPUT_FILE);
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(artalkComments, null, 2));
  console.log(`✅ Exported ${artalkComments.length} comments to ${OUTPUT_FILE}`);

  if (fs.existsSync(outputPath)) {
    console.log('✅ File successfully written:', outputPath);
    console.log('📦 Preview:', JSON.stringify(artalkComments[0], null, 2));
  } else {
    console.error('❌ Output file was not created:', outputPath);
    process.exit(1);
  }
})();

function extractPageKey(title) {
  if (MAPPING === 'pathname') {
    // 标准化路径：确保以 / 开头和结尾
    const trimmed = title.trim().replace(/^\/+|\/+$/g, '');
    return '/' + trimmed + '/';
  }
  // fallback: 使用 kebab-case 生成路径，确保以 / 开头和结尾
  return '/' + title.trim().toLowerCase().replace(/\s+/g, '-') + '/';
}