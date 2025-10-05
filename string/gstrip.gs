string.gstrip = function(o, riPos=0, maxCount=(-1)) // gstrip (i.e grand strip) comes with extra functionality :: finds and removes char from string // riPos: returns a list of (mapped) removed index positiions/chars ( [1 = [pos], 2 = [char], 3 = [{index:char}] ) // maxCount: stops after x amount of removals 
	i = 0; r = o.len; s = self.len
	if riPos then riList = []
	if maxCount != (-1) then roof = 0
	while (i +r) != s
		c = self[i:(r +i)] // c = check
		if c == o then
			// if riPos isn't 0 (i.e false) then return chosen data format
			if riPos >0 then
				if riPos == 2 then
					riList.push(c)
				else if riPos == 3 then
					riList.push({"indexes":[i, r+i], "chars":c})
				else
					riList.push([i, r+i])
				end if
			end if

			// -- main part
			self = self.split("|") // split to allow index removal
			for j in range( r+i, i ) // index from R-L to allow removal without index error
				self.remove(j)
			end for
			self = self.join("") // return default state
			continue // loop without incrementing (i) to search new char on same index
			// --

			// if using max count, add to roof and break when maxCount is met
			if maxCount != (-1) then
				roof += 1
				if roof == maxCount then break
			end if
		end if

		i += 1
	end while

	if riPos then self = {"result": self, "dList":riList}
	return self
end function