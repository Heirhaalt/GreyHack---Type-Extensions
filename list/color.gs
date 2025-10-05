list.color = function(c) // replaces items in list(self) with a colored variant
	colors = {
		"white"  :"#FFFFFF", //?
		"red"    :"#FF0000", //31
		"green"  :"#00FF00", //32
		"yellow" :"#FFFF00", //33
		"orange" :"#FFAA00",
		"gray"   :"#808080",
		"black"  :"#000000", //??
	}
	
	output = []
	if c[1:] != "#" then
		if colors.indexes.indexOf(c) != null then
			for obj in self
				output.push("<color=" +colors[c] +">" +obj +"</color>")
			end for
			
			return output
		end if
	else
		for obj in self
			output.push( "<color=" +c +">" +obj +"</color>")
		end for
	
		return output
	end if

	for obj in self
		output.push("<color=#FF00FF>" +obj +"</color>")
	end for
	
	return output
end function