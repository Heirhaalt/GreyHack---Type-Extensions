list.jut = function(n = 1, singleS=0, sp=0)
	jut = "	" // tab
	if sp then jut = " " //space

	tabs = []
	for i in range(1, n)
		tabs.push(jut)
	end for
	
	if singleS then tabs = tabs.join("")
	return self.insert(0, tabs)
end function