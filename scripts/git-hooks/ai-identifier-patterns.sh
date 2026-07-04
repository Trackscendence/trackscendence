# Shared deny-list of AI-tooling identifiers, sourced by the git hooks.
#
# The project must not ship any reference to AI tooling — not in source,
# comments, docs, config, fixtures, filenames, commit messages, or commit
# metadata. This is the single source of truth for what "AI tooling" means so
# the content, filename, message, and identity checks all agree.
#
# NOTE: this directory is excluded from the content scan (see the hooks), so
# the words listed here do not trip the very check they define.

# Matched (case-insensitively) against staged file CONTENT and commit MESSAGES.
AI_IDENTIFIER_REGEX='claude|anthropic|codex|copilot|openai|AGENTS\.md|(^|/)\.agents/|generated with[^\n]*(claude|codex|copilot|openai)|co-authored-by:.*([^a-z]|^)ai([^a-z]|$)'

# Matched (case-insensitively) against staged FILENAMES.
AI_FILENAME_REGEX='claude|codex|copilot|anthropic|openai|AGENTS\.md|(^|/)\.agents(/|$)'

# Matched (case-insensitively) against the commit AUTHOR and COMMITTER identity.
AI_IDENTITY_REGEX='claude|codex|copilot|anthropic|openai|powered by ai'
