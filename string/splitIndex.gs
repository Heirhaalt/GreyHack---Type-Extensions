string.splitIndex = function(n)
	return self.split("(?<=^.{" +n +"})")
end function