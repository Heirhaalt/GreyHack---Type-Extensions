string.strip = function(o, maxCount=(-1)) // finds and removes char from string // maxCount: stops after x amount of removals 
	if maxCount != (-1) then roof = 0
	
	i = 0; r = o.len; s = self.len
	while (i +r) != s
		c = self[i:(r +i)] // c = check
		if c == o then
			// -- main part
			self = self.split("|") // split to allow index removal
			for j in range( r+i, i+1 ) // index from R-L to allow removal without index error
				self.remove(j)
			end for
			self = self.join("") // return default state
			continue // loop without incrementing (i) to search new char on same index

			// if using max count, add to roof and break when maxCount is met
			if maxCount != (-1) then
				roof += 1
				if roof == maxCount then break
			end if
		end if

		i += 1
	end while

	return self
end function