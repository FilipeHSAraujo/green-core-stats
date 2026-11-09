// Fictional sample data, used for the example cards and in tests. Not real statistics.
export const sampleUser = {
  name: 'Sample User',
  login: 'sample-user',
  contributionsCollection: {
    totalCommitContributions: 342,
    restrictedContributionsCount: 58,
    contributionCalendar: { totalContributions: 512 },
  },
  pullRequests: { totalCount: 41 },
  issues: { totalCount: 17 },
  repositories: {
    totalCount: 28,
    nodes: [
      { stargazerCount: 6, languages: { edges: [
        { size: 90000, node: { name: 'JavaScript' } },
        { size: 40000, node: { name: 'HTML' } },
        { size: 30000, node: { name: 'CSS' } },
      ] } },
      { stargazerCount: 3, languages: { edges: [
        { size: 70000, node: { name: 'Java' } },
        { size: 20000, node: { name: 'GDScript' } },
      ] } },
      { stargazerCount: 1, languages: { edges: [
        { size: 25000, node: { name: 'Python' } },
        { size: 9000, node: { name: 'C#' } },
      ] } },
    ],
  },
};
