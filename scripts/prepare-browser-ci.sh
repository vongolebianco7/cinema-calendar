#!/usr/bin/env bash
set -euo pipefail

# The Azure Ubuntu mirror stalled browser prerequisites until jobs timed out.
# Use Canonical's standard archive, retaining suites, signatures and protocol.
# Hosted runners reference this mirror list from their deb822 sources file.
for cinelva_apt_source in /etc/apt/sources.list /etc/apt/sources.list.d/ubuntu.sources /etc/apt/apt-mirrors.txt; do
  if [[ -f "$cinelva_apt_source" ]]; then
    sudo sed -i 's|azure\.archive\.ubuntu\.com/ubuntu|archive.ubuntu.com/ubuntu|g' "$cinelva_apt_source"
    echo "Prepared browser dependency source: $cinelva_apt_source"
  fi
done
