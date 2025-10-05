// duplicates
list.trim = function // removes any whitespace // method is unfaithful to what trim should be
	for i in range(self.len -1)
		if self[i] == "" then self.remove(i)
	end for

	return self
end function

list.trim = function // not reviewed
	while true
		if self.indexOf("") != null then
			self.remove( self.indexOf("") )
		else
			break
		end if
	end while

	return self
end function

// main
list.trim = function(o="") 
	return self[self[0] == o:-(self[self.len-1] == o)]
end function