string.int = function
	if self.len >0 and self[0] == "0" then // averting bug if number starts with 0
		for i in range(0, self.len -1)
			if self[i] != "0" then break
		end for
		self = self[-i:]
	end if

	if (self.val isa number) and (str(self.val) == self) then
		return self.val
	end if

	return self
end function