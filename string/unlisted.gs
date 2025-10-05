string.isOneOf = function(lst) // check self-string against items in list
	return lst.indexOf(self) != null
end function
string.isAnyOf = function(lst)
	return self.isOneOf(lst)
	//return lst.indexOf(self) != null
end function

string.canbenum = function
	return self.val isa number and str(self.val) == self
end function

string.ssubsplit = function(splitby)
	return self.split(splitby).subsplit
end function

string.unmorsify = function
	o = self.split("'")

	mergedMap = morseTable.merge
	result = []
	for p in o
		if mergedMap.values.indexOf(p) == null then
			result.push "?"
		else
			result.push mergedMap.indexes[mergedMap.values.indexOf(p)].upper
			// result.push(mergedMap.vindexOf(p))
		end if
	end for

	return result.join("")
end function

string.size = function
	return self.len - 1
end function

string.jut = function(n = 1)
	tabs = ""
	for i in range(1, n)
		tabs = tabs +"	"
	end for

	return tabs + self
end function

string.color = function(c)
	colors = {
		"white"  :"#FFFFFF", //?
		"red"    :"#FF0000", //31
		"green"  :"#00FF00", //32
		"yellow" :"#FFFF00", //33
		"orange" :"#FFAA00",
		"gray"   :"#808080",
		"black"  :"#000000", //??
	}
	
	if c[1:] != "#" then
		if colors.indexes.indexOf(c) != null then
			return "<color=" +colors[c] +">" +self +"</color>"
		end if
	else
		return "<color=" +c +">" +self +"</color>"
	end if

	return "<color=#FF00FF>" +self +"</color>"
end function

string.anyOf = function(lst, allTrue=false)
	// a similar method should exist in reversed order
	if allTrue then
		for item in lst
			if self != item then return false
		end for

		return true
	else
		for item in lst
			if self == item then return true
		end for
		return false
	end if
end function

string.checkIndexs = function(label)
	return label == self
end function