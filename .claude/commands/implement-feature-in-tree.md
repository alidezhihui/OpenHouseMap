Create a new git worktree for implementing a feature, then do the implementation work inside that worktree.

## Steps

1. **Create the worktree**: Use the `EnterWorktree` tool with a name derived from the feature request (e.g., kebab-case summary of the feature, max 30 chars).

2. **Implement the feature**: Carry out the implementation described below inside the worktree. Follow normal development practices — read relevant code first, make focused changes, and verify the build compiles.

3. **Commit the work**: Create a commit with a clear message describing what was done.

4. **Report back**: Summarize the changes and ask the user if they want to merge into the original branch or keep the worktree for further work.

## Feature to implement

$ARGUMENTS
