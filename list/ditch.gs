list.ditch = function(o=" ")
	while 1
		switch = 1
		for n in range(self.len -1)
			if self[n] == o then
				self.remove(n)
				switch = 0
				break
			end if
		end for

		if switch then return self
	end while
end function

// usage: ["some", " ", "items"].ditch(" ")