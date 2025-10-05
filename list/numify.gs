list.numify = function(litteral=0)
	output = []
	for obj in self
		if litteral then
			output.push(obj.val)
		else
			if (obj.val isa number) and (str(obj.val) == obj) then
				output.push(obj.val)
			else
				output.push(obj.val)
			end if
		end if
	end for

	return output
end function