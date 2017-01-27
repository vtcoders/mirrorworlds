#!/bin/bash

# This will not work unless
# build/mw_videoMotionTracking/mw_videoMotionTracking exists

xfce4-terminal --geometry 140x40+1196-19 -x nc -l 5555 

build/mw_videoMotionTracking/mw_videoMotionTracking\
 3344\
 rtsp://192.168.1.4:554/live/ch1\
 localhost\
 5555
