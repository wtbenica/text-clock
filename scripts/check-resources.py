#!/usr/bin/env python3

# SPDX-FileCopyrightText: 2024-2025 Wesley Benica <wesley@benica.dev>
#
# SPDX-License-Identifier: GPL-3.0-or-later

"""
Check referenced files in resources/preferences.gresource.xml and report missing ones.
Exit codes:
  0 - all files exist
  1 - XML missing or parse error
  2 - one or more referenced files missing
"""
import sys
import os
import xml.etree.ElementTree as ET

XML_PATH = os.path.join('resources', 'preferences.gresource.xml')

if not os.path.exists(XML_PATH):
    print(f"ERROR: {XML_PATH} not found", file=sys.stderr)
    sys.exit(1)

try:
    root = ET.parse(XML_PATH).getroot()
except Exception as e:
    print(f"ERROR: failed to parse {XML_PATH}: {e}", file=sys.stderr)
    sys.exit(1)

missing = []
for file_el in root.findall('.//file'):
    if file_el.text is None:
        continue
    fname = file_el.text.strip()
    path = os.path.join('resources', fname)
    if not os.path.exists(path):
        missing.append(fname)

if missing:
    print('Missing resource files:')
    for m in missing:
        print(' -', m)
    sys.exit(2)

print('All referenced resource files exist.')
sys.exit(0)
