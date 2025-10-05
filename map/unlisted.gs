map.add = function(a, b)
	self[self.len] = {"a":1, "b":2}
end function

map.voidOf = function(obj)
	return self.indexes.indexOf(obj) == null
end function

map.merge = function
	result = {}
	for m in self.values

		for s in m
			result[s.key] = s.value
		end for

	end for

	return result
end function

map.vindexOf = function(index)
	o = self.values.indexOf(index)
	if o != null then return self.indexes[o]
end function

map.scrap = function(c)
	if c isa string then
		self.remove(self.indexOf(c))
	else if c == list then
		for label in c
			if label isa number then self.remove(self.indexOf(c)) else self.remove(self.indexOf(label))
		end for
	else
		self.remove(c)
	end if
end function

map.protected = function(pto, pType="w") // get_shell.host_computer.File("/root").protected >> bool
	validMap = typeof(self) == ("file" or "pfile")
	if validMap then
		return self.has_protection(pType)
	end if
end function