list.last = function // possibly simpler, or possibly not
	return self[range(list.len)[0]]
end function

list.last = function // returns last index as an object
	return self[self.len -1]
end function