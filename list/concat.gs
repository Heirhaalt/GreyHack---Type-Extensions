list.concat = function(lst) // pushes content from secondary list
	// wise to update so it can bring from multiple lists
	for obj in lst
		self.push(obj)
	end for

	return self
end function