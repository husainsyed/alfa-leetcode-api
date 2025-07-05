import { Request, Response } from 'express';
import * as gqlQueries from './GQLQueries';
import * as formatUtils from './FormatUtils';
import * as controllers from './Controllers';
import { TransformedUserDataRequest } from './types';

export const userData = (req: TransformedUserDataRequest, res: Response) => {
  controllers.fetchUserDetails(
    req.body,
    res,
    formatUtils.formatUserData,
    gqlQueries.userProfileQuery
  );
};

export const userBadges = (req: TransformedUserDataRequest, res: Response) => {
  controllers.fetchUserDetails(
    req.body,
    res,
    formatUtils.formatBadgesData,
    gqlQueries.userProfileQuery
  );
};

export const userContest = (req: TransformedUserDataRequest, res: Response) => {
  controllers.fetchUserDetails(
    req.body,
    res,
    formatUtils.formatContestData,
    gqlQueries.contestQuery
  );
};

export const userContestHistory = (
  req: TransformedUserDataRequest,
  res: Response
) => {
  controllers.fetchUserDetails(
    req.body,
    res,
    formatUtils.formatContestHistoryData,
    gqlQueries.contestQuery
  );
};

export const solvedProblem = (
  req: TransformedUserDataRequest,
  res: Response
) => {
  controllers.fetchUserDetails(
    req.body,
    res,
    formatUtils.formatSolvedProblemsData,
    gqlQueries.userProfileQuery
  );
};

export const submission = (req: TransformedUserDataRequest, res: Response) => {
  controllers.fetchUserDetails(
    req.body,
    res,
    formatUtils.formatSubmissionData,
    gqlQueries.submissionQuery
  );
};

export const acSubmission = (
  req: TransformedUserDataRequest,
  res: Response
) => {
  controllers.fetchUserDetails(
    req.body,
    res,
    formatUtils.formatAcSubmissionData,
    gqlQueries.AcSubmissionQuery
  );
};

export const calendar = (req: TransformedUserDataRequest, res: Response) => {
  controllers.fetchUserDetails(
    req.body,
    res,
    formatUtils.formatSubmissionCalendarData,
    gqlQueries.userProfileQuery
  );
};

//Problems Details
export const dailyProblem = (_req: Request, res: Response) => {
  controllers.fetchSingleProblem(
    res,
    formatUtils.formatDailyData,
    gqlQueries.dailyProblemQuery,
    null
  );
};

export const selectProblem = (req: Request, res: Response) => {
  const title = req.query.titleSlug as string;
  if (title !== undefined) {
    controllers.fetchSingleProblem(
      res,
      formatUtils.formatQuestionData,
      gqlQueries.selectProblemQuery,
      title
    );
  } else {
    res.status(400).json({
      error: 'Missing or invalid query parameter: titleSlug',
      solution: 'put query after select',
      example: 'localhost:3000/select?titleSlug=two-sum',
    });
  }
};

export const problems = (
  req: Request<
    {},
    {},
    {},
    { limit: number; skip: number; tags: string; difficulty: string }
  >,
  res: Response
) => {
  const difficulty = req.query.difficulty;
  const limit = req.query.limit;
  const skip = req.query.skip;
  const tags = req.query.tags;

  controllers.fetchProblems(
    { limit, skip, tags, difficulty },
    res,
    formatUtils.formatProblemsData,
    gqlQueries.problemListQuery
  );
};

export const trendingCategoryTopics = (_req: Request, res: Response) => {
  const first = parseInt(_req.query.first as string);
  if (!isNaN(first)) {
    controllers.fetchTrendingTopics(
      { first },
      res,
      formatUtils.formatTrendingCategoryTopicData,
      gqlQueries.trendingDiscussQuery
    );
  } else {
    res.status(400).json({
      error: 'Missing or invalid query parameter: limit',
      solution: 'put query after discussion',
      example: 'localhost:3000/trendingDiscuss?first=20',
    });
  }
};

export const languageStats = (_req: Request, res: Response) => {
  const username = _req.query.username as string;
  if (username) {
    controllers.fetchDataRawFormat(
      { username },
      res,
      gqlQueries.languageStatsQuery
    );
  } else {
    res.status(400).json({
      error: 'Missing or invalid query parameter: username',
      solution: 'put query after discussion',
      example: 'localhost:3000/languageStats?username=uwi',
    });
  }
};

// New route for userProfile/:username/today
export const userProfileToday = async (req: Request, res: Response) => {
  const username = req.params.username;

  try {
    const response = await fetch('https://leetcode.com/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Referer: 'https://leetcode.com',
      },
      body: JSON.stringify({
        query: `#graphql
        query getUserProfile($username: String!) {
          allQuestionsCount {
            difficulty
            count
          }
          matchedUser(username: $username) {
            username
            githubUrl
            twitterUrl
            linkedinUrl
            contributions {
              points
              questionCount
              testcaseCount
            }
            profile {
              realName
              userAvatar
              birthday
              ranking
              reputation
              websites
              countryName
              company
              school
              skillTags
              aboutMe
              starRating
            }
            badges {
              id
              displayName
              icon
              creationDate
            }
            upcomingBadges {
              name
              icon
            }
            activeBadge {
              id
              displayName
              icon
              creationDate
            }
            submitStats {
              totalSubmissionNum {
                difficulty
                count
                submissions
              }
              acSubmissionNum {
                difficulty
                count
                submissions
              }
            }
            submissionCalendar
          }
          recentSubmissionList(username: $username, limit: 20) {
            title
            titleSlug
            timestamp
            statusDisplay
            lang
          }
        }`,
        variables: {
          username: username,
        },
      }),
    });

    const result = await response.json();

    if (result.errors) {
      res.status(400).json({ error: result.errors[0].message });
      return;
    }

    const submissionCalendar = JSON.parse(
      result.data.matchedUser.submissionCalendar
    );

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth =
      String(now.getMonth() + 1).length === 1
        ? `0${now.getMonth() + 1}`
        : now.getMonth() + 1;
    const currentDay =
      String(now.getDate()).length === 1 ? `0${now.getDate()}` : now.getDate();
    const today = `${currentYear}-${currentMonth}-${currentDay}`;

    let total = 0;

    for (const [t, n] of Object.entries(submissionCalendar)) {
      const d = new Date(Number(t) * 1000).toISOString();
      if (d != null) {
        let datePart = d.split('T')[0];
        const year = datePart.split('-')[0];
        const month = datePart.split('-')[1];
        const day = datePart.split('-')[2];

        const epochDate = `${year}-${month}-${day}`;
        if (epochDate === today) {
          total += n as number;
        }
      }
    }

    res.json({
      username: username,
      todaySubmissionCount: total,
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Failed to fetch submission calendar' });
  }
};