// scripts/export.js
const { GraphQLClient, gql } = require('graphql-request');
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const REPO_OWNER = process.env.REPO_OWNER;
const REPO_NAME = process.env.REPO_NAME;
const CATEGORY_NAME = process.env.DISCUSSION_CATEGORY;
const SITE_NAME = process.env.SITE_NAME || 'My Site';
const MAPPING = process.env.MAPPING || 'pathname';
const OUTPUT_FILE = process.env.OUTPUT_FILE || 'output/comments.json';

if (!GITHUB_TOKEN || !REPO_OWNER || !REPO_NAME || !CATEGORY_NAME) {
  console.error('Missing required environment variables.');
  process.exit(1);
}

const graphql = new GraphQLClient('https://api.github.com/graphql', {
  headers: {
    Authorization: `bearer ${GITHUB_TOKEN}`,
  },
});

const userCache = {};

async function getUserEmail(login) {
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

const commentsQuery = gql`
  query GetComments($owner: String!, $name: String!, $number: Int!, $after: String) {
    repository(owner: $owner, name: $name) {
      discussion(number: $number) {
        comments(first: 100, after: $after) {
          pageInfo { hasNextPage endCursor }
          nodes {
            id
            bodyText
            createdAt
            author {
              login
              url
            }
            replyTo { id }
          }
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

async function fetchAllComments(discussionNumber) {
  const comments = [];
  let after = null;
  while (true) {
    const variables = { owner: REPO_OWNER, name: REPO_NAME, number: discussionNumber, after };
    const data = await graphql.request(commentsQuery, variables);
    const page = data.repository.discussion.comments;
    comments.push(...page.nodes);
    if (!page.pageInfo.hasNextPage) break;
    after = page.pageInfo.endCursor;
  }
  return comments;
}

(async () => {
  const discussions = (await fetchDiscussions()).filter(
    d => d.category?.name === CATEGORY_NAME
  );
  let idCounter = 1;
  const artalkComments = [];
  const commentIdMap = new Map();

  for (const discussion of discussions) {
    const pageKey = extractPageKey(discussion.title);
    const comments = await fetchAllComments(discussion.number);
    for (const comment of comments) {
      const email = comment.author?.login
        ? await getUserEmail(comment.author.login)
        : 'anonymous@unknown';

      const commentData = {
        id: idCounter++,
        page_key: pageKey,
        site_name: SITE_NAME,
        content: comment.bodyText,
        created_at: comment.createdAt,
        nick: comment.author?.login || 'Anonymous',
        link: comment.author?.url || '',
        email,
        rid: 0,
      };

      commentIdMap.set(comment.id, commentData.id);
      if (comment.replyTo?.id) {
        commentData.rid = commentIdMap.get(comment.replyTo.id) || 0;
      }

      artalkComments.push(commentData);
    }
  }

  const outputPath = path.resolve(OUTPUT_FILE);
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(artalkComments, null, 2));
  console.log(`✅ Exported ${artalkComments.length} comments to ${OUTPUT_FILE}`);
  
})();

function extractPageKey(title) {
  if (MAPPING === 'pathname') {
    const match = title.match(/\/([^\s]+)$/);
    return match ? '/' + match[1] : '/';
  }
  return '/' + title.toLowerCase().replace(/\s+/g, '-');
}
