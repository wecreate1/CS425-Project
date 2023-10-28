#!/bin/sh

while inotifywait -e close_write er.puml; do plantuml er.puml; done
