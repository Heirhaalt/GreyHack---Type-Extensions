list.anyOf = function(lst, allTrue=false) // searching self list for a match in compared list | allTrue: returns false if x in self is absent
	
	for item in lst
		if allTrue and self.indexOf(item) == null then return false
		if self.indexOf(item) then return true
	end for

	return false
end function