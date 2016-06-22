```
update()
+-- Emit "update started" event
|
+-- For each "type" in "this._types"
| +-- Download the .zip file, extract it and return XML data using function
| |   "this._downloader.download(type)"
| |
| +-- Convert the XML data to JSON, return array of entries using function
| |   "this._converter.parse(xmlData)"
| |
| +-- For each "entry" in "objects"
| | +-- Check if entry already exists, identified by "entry.ObjectCode"
| | | `-- TODO: Create transport API to get entry (CRUD)
| | |
| | +-- If entry exists
| | | +-- Check if entry has updated
| | | | `-- TODO: How to check if a entry has updated? Hash of entry object or
| | | |     only use the field "entry.ObjectDetails.DatumWijziging"?
| | | |
| | | +-- If entry has updated
| | | | +-- Find out what properties have updated
| | | | | `-- Deepdiff the two objects, resulting in an object of "added",
| | | | |     "updated", "unchanged", "soft removed" or "removed" fields
| | | | |
| | | | +-- Check status for existing in "this._queueForRemoval"
| | | | | `-- If status is one of "this._queueForRemoval"
| | | | |   +-- Add to queue
| | | | |   | `-- TODO: Create transport API to queue objects for removal
| | | | |   |
| | | | |   +-- Emit "entry soft removed" event (passing type, updated entry 
| | | | |   |   object and deepdiff of entry)
| | | | |   |
| | | | |   `-- Emit "entry parsed" event (passing type, status (being "soft 
| | | | |       removed"), updated entry object and deepdiff of entry)
| | | | |
| | | | +-- Store updated entry using transport
| | | | | `-- TODO: Create transport API to store entry (CRUD)
| | | | |
| | | | +-- Emit "entry updated" event (passing type, updated entry object and
| | | | |   deepdiff of entry)
| | | | |
| | | | `-- Emit "entry parsed" event (passing type, status (being "updated"), 
| | | |     updated entry object and deepdiff of entry)
| | | |
| | | +-- If entry has been "removed" (read documentation about what "removed"
| | | | | exactly means)
| | | | `-- If entry has status "Ingetrokken"
| | | |   +-- TODO: Create transport API to remove entry (CRUD)
| | | |   |
| | | |   +-- Emit "entry removed" event (passing type and removed entry object)
| | | |   |
| | | |   `-- Emit "entry parsed" event (passing type, status (being "removed")
| | | |       and removed entry object)
| | | |
| | | +-- If entry hasn't updated
| | | | +-- Emit "entry unchanged" event (passing type and unchanged entry
| | | | |   object)
| | | | |
| | | | `-- Emit "entry parsed" event (passing type, status (being "unchanged")
| | | |     and unchanged entry object)
| | | |
| | | `-- Update media for entry
| | |   `-- TODO: add more documentation here
| | |
| | +-- If entry doesn't exist
| | | +-- Store added entry using transport
| | | | `-- TODO: Create transport API to add entry (CRUD)
| | | |
| | | +-- Emit "entry added" event (passing type and added entry object)
| | | |
| | | `-- Emit "entry parsed" event (passing type, status (being "added") and
| | |     added entry object)
| | |
| | `-- Increment counter for "status" and re-iterate
| |
| `-- Return object with counters
|
+-- Remove entries queued for removal
|    
`-- Emit `update finished` event (including object with information about the
    update, with one property per "type". Each type should contain an object
    with the keys "updated", "unchanged", "added", "soft removed" and "removed",
    followed by a counter)
```

To walk through the tree, start at the root, go into a branch, keep interating until you reached the last element (leaf) of a branch and then go back one level, iterate again