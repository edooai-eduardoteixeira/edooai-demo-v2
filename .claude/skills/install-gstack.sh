#!/bin/bash
# Install GStack if not already present
if [ ! -d ~/.claude/skills/gstack ]; then
  git clone https://github.com/garrytan/gstack.git ~/.claude/skills/gstack
  cd ~/.claude/skills/gstack && ./setup
fi
