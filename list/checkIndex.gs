list.checkIndex = function(label) // checks label (type) for matching index in self
	if label isa list then
		for obj in self
			if lst.indexOf(obj) != null then return 1
		end for
	
		return 0
	else
		return self.indexOf(label) != null
	end if	
end function