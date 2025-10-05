string.splitMultiple = function(cuts)
	pats = []
	for p in cuts
		pats.push("(?<=^.{"+p+"})")
	end for

	return self.split(pats.join("|"))
end function