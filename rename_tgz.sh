#!/bin/bash
filename="rhodonite-tmp.tgz"
mv $(ls -t *.tgz | head -n1) "$filename"
