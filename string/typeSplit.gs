string.typeSplit = function
	remSpace = function(_)
		for i in range(_.len -1)
			if _[i] == "" then _.remove(i)
		end for
		
		return _
	end function

	sA = remSpace(self.split("\D+"))
	sB = remSpace(self.split("\d+"))

	sC = []
	for i in range(0, sA.len -1)
		sC.push(sA[i].val)
		if sB.hasIndex(i) then sC.push(sB[i])
	end for

	return sC
end function