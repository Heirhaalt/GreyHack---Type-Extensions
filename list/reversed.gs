list.reversed = function() // a functional variant of "list.reverse"
	for i in range(self.len -1)
		self.push(self[i])
		self.remove(i)
	end for
	
	return self
end function