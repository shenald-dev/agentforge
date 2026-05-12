#!/bin/bash
sed -i '/<<<<<<< HEAD/d' .jules/bolt.md
sed -i '/=======/d' .jules/bolt.md
sed -i '/>>>>>>> origin\/master/d' .jules/bolt.md
