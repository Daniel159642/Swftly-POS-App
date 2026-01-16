# Quick Sync Guide 🚀

## For Daily Use

### Start Your Day
```bash
git checkout develop
git pull origin develop
git checkout -b feature/your-feature-name
```

### Sync Multiple Times Per Day (Avoid Conflicts!)
```bash
./sync.sh
```

That's it! The script will:
- ✅ Pull latest changes
- ✅ Merge them into your branch
- ✅ Show you conflicts if any

### End Your Day / Push Your Work
```bash
git add .
git commit -m "Your descriptive message"
git push origin feature/your-feature-name
```

## The Golden Rules

1. **Always use feature branches** - Never work directly on `main` or `develop`
2. **Sync often** - Run `./sync.sh` multiple times per day
3. **Work on different files** - Coordinate who works on what
4. **Commit small changes** - Easier to merge and understand

## If You Get Conflicts

1. The sync script will tell you which files
2. Open those files
3. Look for `<<<<<<<`, `=======`, `>>>>>>>` markers
4. Choose what to keep (yours, theirs, or both)
5. Remove the markers
6. Run: `git add . && git commit`

## Need More Help?

See `COLLABORATION_GUIDE.md` for detailed instructions.
