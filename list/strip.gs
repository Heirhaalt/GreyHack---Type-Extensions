#include "../string/strip"
list.strip = function(c) // strip in each position | early-simple variant
	for i in range(self)
		if self[i] == c then
			if self[i] isa strign then self[i] = self[i].strip(c)
		end if
	end for

	return self
end function