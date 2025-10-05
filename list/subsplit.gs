list.subsplit = function(pattern="|", depth=(-1), upfront=0) // for each string in list, split | pattern: regex pattern (splitter) | depth: limit splitting nest levels (-1 unrestricted) | upfront: bring every item into parent nest 
	subsplit = function(o, pattern, depth=(-1), upfront=0)
		if depth != -1 then
			if depth == 0 then return o
			depth -= 1
		end if

		if o isa string then
			parts = o.split(pattern)
			if parts.len == 1 then return o // greater if statement not needed, stops on return anyways
			return subsplit(parts, pattern, depth)
		end if

		insert_flat = function(splits, res)
			for elt in res
				if elt isa list then
					for subelt in elt
						splits.insert(0, subelt)
					end for
				else
					splits.insert(0, elt)
				end if
			end for
		end function

		splits = []
		for i in range(o.len -1)
			if o[i] isa list then

				res = subsplit(o[i], pattern, depth, upfront)
				if upfront then
					insert_flat(splits, res)
				else
					splits.insert(0, res)
				end if

			else if o[i] isa string then
				parts = o[i].split(pattern)

				if parts.len == 1 then
					splits.insert(0, o[i])
				else

					res = subsplit( parts, pattern, depth, upfront)
					if upfront then
						insert_flat(splits, res)
					else
						splits.insert(0, res)
					end if

				end if
			else
				splits.insert(0, o[i])
			end if
		end for

		bringToFront = function(o)
			batch = []
			for lst in o
				if lst isa list then
					for sublst in bringToFront(lst)
						batch.push(sublst)
					end for

					continue
				end if

				batch.push(lst)
			end for

			return batch
		end function

		//if upfront then splits = bringToFront(splits)

		return splits
	end function

	return subsplit(self, pattern, depth, upfront)
end function