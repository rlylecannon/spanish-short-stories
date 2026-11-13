#!/bin/bash
# syntax-check EVERY script block in the built page
# PURPOSE: catch JavaScript syntax errors in the generated index.html (the DATA block, art.js, conj.js and app.js are all inline
#   <script> blocks), which the Python build itself cannot detect.
# INPUT: $1 = path to the built HTML file, e.g. free-spanish-stories/index.html (required).
# USAGE: bash tools/check_js.sh free-spanish-stories/index.html
# HOW: an embedded Python program (the heredoc below) extracts every <script ...>...</script> body with a non-greedy,
#   DOTALL regex, writes each to /tmp/chk<N>.js, and runs `node --check` on it. Requires node and python3 on PATH.
# OUTPUT: "all scripts OK", or "SYNTAX ERROR in script N" lines followed by "FAILED". Exit status = number of failing blocks
#   (0 = all fine).
# SAFE TO RE-RUN: yes. It never touches the project; it only writes scratch files /tmp/chk*.js. Note that blocks are checked as
#   plain scripts, so a block that relies on being loaded as an ES module would be misreported.
# Everything between <<'P' and the closing P line is Python, passed to python3 unexpanded (quoted heredoc), so keep it comment-free.
python3 - "$1" <<'P'
import re,subprocess,sys
h=open(sys.argv[1],encoding='utf-8').read(); bad=0
for i,s in enumerate(re.findall(r'<script[^>]*>(.*?)</script>',h,re.S)):
    open(f'/tmp/chk{i}.js','w').write(s); r=subprocess.run(['node','--check',f'/tmp/chk{i}.js'],capture_output=True,text=True)
    if r.returncode: bad+=1; print('SYNTAX ERROR in script',i,r.stderr[:300])
print('all scripts OK' if not bad else 'FAILED'); sys.exit(bad)
P
