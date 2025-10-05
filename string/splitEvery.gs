string.splitEvery = function(n)
	return self.split("(?<=\G.{" +n +"})")
end function