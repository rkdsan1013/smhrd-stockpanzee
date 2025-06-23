// src/services/redditService.ts
import snoowrap from "snoowrap";
import dotenv from "dotenv";
dotenv.config();

const reddit = new snoowrap({
  userAgent: process.env.USER_AGENT!,
  clientId: process.env.REDDIT_CLIENT_ID!,
  clientSecret: process.env.REDDIT_CLIENT_SECRET!,
  username: process.env.REDDIT_USERNAME!,
  password: process.env.REDDIT_PASSWORD!,
});

export interface RedditComment {
  subreddit: string;
  commentBody: string;
  score: number;
  createdUtc: number;
}

export const fetchCommentsByKeyword = async (
  keyword: string,
  maxComments = 50,
): Promise<RedditComment[]> => {
  const allComments: RedditComment[] = [];
  const posts = await reddit.search({
    query: keyword,
    sort: "new",
    time: "day",
    limit: 30,
  });

  for (const post of posts) {
    try {
      const comments = await post.comments.fetchAll();
      for (const comment of comments) {
        allComments.push({
          subreddit: post.subreddit.display_name,
          commentBody: comment.body,
          score: comment.score,
          createdUtc: comment.created_utc,
        });
        if (allComments.length >= maxComments) return allComments;
      }
    } catch (err) {
      console.error(`❌ Error in post ${post.id}:`, err);
    }
  }

  return allComments;
};

// 컨트롤러에서 쓰던 fetchPosts 이름 유지할 수 있도록 alias 추가
export const fetchPosts = fetchCommentsByKeyword;
