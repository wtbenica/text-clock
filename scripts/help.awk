#!/usr/bin/awk -f

# Simplified help extractor — preserves existing output but is shorter and
# easier to maintain. Always prints a leading blank line for `make help`.

BEGIN { print ""; printed = 0 }

# Section headers: ## === Name ===
/^[ \t]*##[ \t]*===[ \t]*/ {
    s = $0
    sub(/^[ \t]*##[ \t]*===[ \t]*/, "", s)
    sub(/[ \t]*===[ \t]*$/, "", s)
    gsub(/^[ \t]+|[ \t]+$/, "", s)
    if (printed) print ""
    print s ":"
    printed = 1
    next
}

# Target descriptions: '## some text'
/^[ \t]*##[ \t].*/ {
    line = $0
    sub(/^[ \t]*## /, "", line)
    print "  " line
    printed = 1
    next
}

END {
    if (!printed) print "No help entries found."
}
