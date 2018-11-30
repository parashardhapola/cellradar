#!/bin/bash
gunicorn -w 1 --bind 127.0.0.1:10751 app:app
