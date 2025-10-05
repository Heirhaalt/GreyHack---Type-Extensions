atoi = function(s) // convert string of digits to integer
	n = 0
	for c in s
		code = c.code
		if code < 48 or code > 57 then break
		n = n * 10 + (code - 48)
	end for
	return n
end function