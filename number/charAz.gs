number.charAz = function(low=false) // returns the binary decimal starting at 65 (A) | low: bool to set upper or lower case (e.g A = 65 a = 97)
	if low then return char(97 +(self -1))
	return char(65 +(self -1))
end function