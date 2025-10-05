// =======================================================================================
// regex.mscr (pure MiniScript) -- Thompson NFA with lookahead (+ fixed-length lookbehind)
// =======================================================================================

regex = {}

// Utilities
lower = function(c)
	if c >= "A" and c <= "Z" then return chr(asc(c) + 32)
	return c
end function

substr = function(s, i, j)
	// slice like Python: [i:j], j exclusive
	if j == null then return s[i : ]
	return s[i : j]
end function

cls_lit = function(ch, icase)
	cls = {}
	cls["type"] = "lit"
	cls["ch"] = ch
	cls["icase"] = icase
	return cls
end function

cls_any = function()
	cls = {}
	cls["type"] = "any"
	return cls
end function

cls_rangeSet = function(ranges, negate, icase)
	cls = {}
	cls["type"] = "range"
	cls["ranges"] = ranges
	cls["negate"] = negate
	cls["icase"] = icase
	return cls
end function

cls_shorthand = function(code, icase)
	cls = {}
	cls["type"] = "shorthand"
	cls["code"] = code
	cls["icase"] = icase
	return cls
end function

// Tokenizer
regex._charMatches = function(state, c)
	cls = state["arg"]
	if cls == null then return false
	kind = cls["type"]

	if kind == "any" then
		return c != null
	end if

	if c == null then return false
	if cls["icase"] then cc = lower(c) else cc = c

	if kind == "lit" then
		if cls["icase"] then return lower(c) == lower(cls["ch"])
		return c == cls["ch"]
	else if kind == "range" then
		hit = false
		for r in cls["ranges"]
			if cls["icase"] then
				lo = lower(r["lo"]); hi = lower(r["hi"])
			else
				lo = r["lo"]; hi = r["hi"]
			end if
			if cc >= lo and cc <= hi then hit = true; break
		end for
		if cls["negate"] then return not hit else return hit
	else if kind == "shorthand" then
		code = cls["code"]
		isDigit = (cc >= "0" and cc <= "9")
		isWord = ((cc >= "a" and cc <= "z") or (cc >= "A" and cc <= "Z") or (cc >= "0" and cc <= "9") or cc == "_")
		isSpace = (cc == " " or cc == "\t" or cc == "\n" or cc == "\r")
		if code == "d" then return isDigit
		if code == "D" then return not isDigit
		if code == "w" then return isWord
		if code == "W" then return not isWord
		if code == "s" then return isSpace
		if code == "S" then return not isSpace
	end if

	return false
end function

regex._tok = function(pat)
	toks = []
	i = 0
	_len = pat.len 
	push = function(kind, val = null)
		toks.push {
			"kind": kind,
			"val": val,
		}
	end function

	escapes = {
		"n": "\n",
		"t": "\t",
		"r": "\r",
		"\\": "\\",
		".": ".",
		"[": "[",
		"]": "]",
		"(": "(",
		")": ")",
		"|": "|",
		"*": "*",
		"+": "+",
		"?": "?",
		"{": "{",
		"}": "}",
		"^": "^",
		"-": "-",
		"/": "/",
	}

	while i < _len
		ch = pat[i]
		if ch == "\\" then
			i += 1
			if i >= _len then
				push "LIT", "\\"
				break
			end if

			cc = pat[i]
			if escapes.hasIndex(cc) then
				push "LIT", escapes[cc]
			else if cc == "d" or cc == "D" or cc == "w" or cc == "W" or cc == "s" or cc == "S" then
				push "CLASS_SH", cc
			else
				// treat \X as literal X if unknown
				push "LIT", cc
			end if

			i += 1
			continue
		end if

		if ch == "." then
			push "DOT"
		else if ch == "^" then
			push "BOL"
		else if ch == "$" then
			push "EOL"
		else if ch == "(" then
			// check for lookaround prefix
			if i + 3 < _len and pat[i + 1] == "?" and pat[i + 2] == "=" then
				push "LOOKAHEAD_START"
				i += 3
				continue
			else if i + 4 < _len and pat[i + 1] == "?" and pat[i + 2] == "<" and pat[i + 3] == "=" then
				push "LOOKBEHIND_START"
				i += 4
				continue
			else
				push "LP"
			end if
		else if ch == ")" then
			push "RP"
		else if ch == "[" then
			// parse char class till ]
			i += 1
			if i >= _len then
				push "LIT", "["
				break
			end if

			neg = false
			if pat[i] == "^" then
				neg = true
				i += 1
			end if

			ranges = []
			inClass = true
			prev = null
			first = true
			while i < _len and inClass
				c = pat[i]
				if c == "\\" then
					i += 1
					if i >= _len then
						c = "\\"
					else
						c = pat[i]
					end if

					if c == "n" then
						c = "\n"
					else if c == "t" then
						c = "\t"
					else if c == "r" then
						c = "\r"
					else if c == "]" and not first then
						inClass = false
						i += 1
						break
					end if
				end if
				first = false
				// range a-b
				if i + 2 < _len and pat[i + 1] == "-" and pat[i + 2] != "]" then
					lo = c
					hi = pat[i + 2]
					if hi == "\\" then
						if i + 3 < _len then
							esc = pat[i + 3]
							if esc == "n" then
								hi = "\n"
							else if esc == "t" then
								hi = "\t"
							else if esc == "r" then
								hi = "\r"
							else
								hi = esc
							end if
							i += 4
						else
							hi = "-"
							i += 2
						end if
					else
						i += 3
					end if

					ranges.push {
						"lo": lo,
						"hi": hi,
					}
				else
					ranges.push {
						"lo": c,
						"hi": c,
					}
					i += 1
				end if
			end while
			push "CLASS", {
				"ranges": ranges,
				"negate": neg,
			}
			continue
		else if ch == "{" then
			// quantifier {m}, {m,}, {,n}, {m,n}
			j = i + 1
			num = ""
			num2 = ""
			stage = 0
			while j < _len and pat[j] != "}"
				c = pat[j]
				if c == "," then
					stage = 1
				else if c >= "0" and c <= "9" then
					if stage == 0 then num += c else num2 += c
				else
					break
				end if
				j += 1
			end while
			if j < _len and pat[j] == "}" and  
				(num.len > 0 or num2.len > 0 or stage == 1) then
				if num.len > 0 then m = val(num) else m = null 
				if num2.len > 0 then n = val(num2) else n = null 
				push "QUANT", {
					"m": m,
					"n": n,
				}
				i = j
			else
				push "LIT", "{" // not a real quant
			end if
		else if ch == "*" then
			push "STAR"
		else if ch == "+" then
			push "PLUS"
		else if ch == "?" then
			push "QMARK"
		else if ch == "|" then
			push "ALT"
		else
			push "LIT", ch
		end if

		i += 1
	end while

	return toks
end function

regex._toPostfix = function(toks)
	out = []
	ops = []

	prec = { // quantifiers are UNARY
		"ALT": 1,
		"CONCAT": 2,
		"UNARY": 3,
	}
	isOperand = function(t)
		return (t["kind"] == "LIT" or t["kind"] == "DOT" or t["kind"] == "CLASS" or t["kind"] == "CLASS_SH" or t["kind"] == "GROUP" or t["kind"] == "ASSERT" or t["kind"] == "BOL" or t["kind"] == "EOL")
	end function

	// We’ll build groups and assertions recursively to keep yard simple.
	// So here toks already has GROUP/ASSERT composite tokens created by _groupify.

	i = 0
	prevCanConcat = false
	while i < toks.len 
		t = toks[i]
		kind = t["kind"]

		// Insert CONCAT between adjacent operands / BOL/EOL relations
		if prevCanConcat and 
			(kind == "LIT" or kind == "DOT" or kind == "CLASS" or kind == "CLASS_SH" or kind == "GROUP" or kind == "ASSERT" or kind == "BOL" or kind == "EOL" or kind == "LOOKAHEAD_START" or kind == "LOOKBEHIND_START") then
			// but actual LOOK* tokens are not expected here (handled in _groupify)
			while ops.len > 0 and prec["CONCAT"] <= prec[ops[-1]["kind"]] 
				out.push ops.pop
			end while
			ops.push { "kind": "CONCAT" }
		end if

		if kind == "LIT" or kind == "DOT" or kind == "CLASS" or kind == "CLASS_SH" or kind == "GROUP" or kind == "ASSERT" or kind == "BOL" or kind == "EOL" then
			out.push t
			prevCanConcat = true
		else if kind == "ALT" then
			while ops.len > 0 and prec["ALT"] <= prec[ops[-1]["kind"]] 
				out.push ops.pop
			end while
			ops.push { "kind": "ALT" }
			prevCanConcat = false
		else if kind == "STAR" or kind == "PLUS" or kind == "QMARK" or kind == "QUANT" then
			if kind == "QUANT" then qk = "QUANT" else qk = "UNARY"

			while ops.len > 0 and prec["UNARY"] <= prec[ops[-1]["kind"]] 
				out.push ops.pop
			end while
			out.push {
				"kind": kind,
				"val": t["val"],
			}
			prevCanConcat = true
		else
			// should not happen
		end if

		i += 1
	end while

	while ops.len > 0 
		out.push ops.pop
	end while

	return out
end function

regex._groupify = function(toks, i = 0, stopKind = null)
	nodes = []
	while i < toks.len 
		t = toks[i]
		kind = t["kind"]
		if stopKind != null and kind == stopKind then return {
			"nodes": nodes,
			"i": i + 1,
		}

		if kind == "LP" then
			sub = regex._groupify(toks, i + 1, "RP")
			nodes.push {
				"kind": "GROUP",
				"val": sub["nodes"],
			}
			i = sub["i"]
			continue
		else if kind == "LOOKAHEAD_START" then
			sub = regex._groupify(toks, i + 1, "RP")
			nodes.push {
				"kind": "ASSERT",
				"aKind": "LA",
				"val": sub["nodes"],
			}
			i = sub["i"]
			continue
		else if kind == "LOOKBEHIND_START" then
			sub = regex._groupify(toks, i + 1, "RP")
			nodes.push {
				"kind": "ASSERT",
				"aKind": "LB",
				"val": sub["nodes"],
			}
			i = sub["i"]
			continue
		else
			nodes.push t
			i += 1
		end if
	end while
	return {
		"nodes": nodes,
		"i": i,
	}
end function

regex._compile = function(astNodes, flags, captureCountRef)
	makeState = function(op, arg = null, out = null, out2 = null)
		return {
			"op": op,
			"arg": arg,
			"out": out,
			"out2": out2,
		}
	end function
	frag = function(start, outs)
		return {
			"start": start,
			"outs": outs,
		}
	end function
	patch = function(states, outs, to)
		for idx in outs
			states[idx]["out"] = to
		end for
	end function
	appendOuts = function(a, b)
		for x in b
			a.push x
		end for
		return a
	end function

	// Convert group/assert recursive nodes to postfix locally, then Thompson-build
	post = regex._toPostfix(astNodes)
	states = [] // vector of states
	newState = function(op, arg = null, out = null, out2 = null)
		states.push makeState( op, arg, out, out2)
		return states.len - 1 
	end function

	stack = []
	icase = (flags.indexOf("i") >= 0)

    if post.len == 0 then
        idx = newState("jmp", null, null, null)
        stack.push(frag(idx, [idx]))
    end if


	buildForNode = function(tok)
		if tok["kind"] == "LIT" then
			cls = cls_lit(tok["val"], icase)
			idx = newState("char", cls, null, null)
			return frag(idx, [ idx ])
		else if tok["kind"] == "DOT" then
			idx = newState("char", cls_any(), null, null)
			return frag(idx, [idx])
		else if tok["kind"] == "CLASS" then
			cls = cls_rangeSet(tok["val"]["ranges"], tok["val"]["negate"], icase)
			idx = newState("char", cls, null, null)
			return frag(idx, [idx])
		else if tok["kind"] == "CLASS_SH" then
			cls = cls_shorthand(tok["val"], icase)
			idx = newState("char", cls, null, null)
			return frag(idx, [idx])

		else if tok["kind"] == "BOL" then
			idx = newState("bol", null, null, null)
			return frag(idx, [ idx ])
		else if tok["kind"] == "EOL" then
			idx = newState("eol", null, null, null)

			return frag(idx, [ idx ])
		else if tok["kind"] == "GROUP" then
			// increase capture index
			gStart = captureCountRef[0] + 1
			captureCountRef[0] = gStart
			sub = regex._compile(tok["val"], flags, captureCountRef)
			// wrap with epsilon — NFA doesn't need special group markers; captures handled in VM
			return frag(sub["start"], sub["outs"])
		else if tok["kind"] == "ASSERT" then
			if tok["aKind"] == "LA" then
				// compile sub-nfa to be used as assertion
				subCapRef = [ 0 ]
				sub = regex._compile(tok["val"], flags, subCapRef)
				aIdx = newState( "assertLA", {
						"states": sub["states"],
						"start": sub["start"],
						"caps": subCapRef[0],
						"flags": flags,
					}, null, null)
				return frag(aIdx, [ aIdx ])
			else
				// LB: must be fixed-length — compute min/max length; if not fixed, error
				lenInfo = regex._lengthOf(tok["val"], flags)
				if lenInfo["min"] != lenInfo["max"] then
					print("regex: (?<=...) must be fixed-length in this engine.")
					exit()
				end if
				subCapRef = [ 0 ]
				sub = regex._compile(tok["val"], flags, subCapRef)
				aIdx = newState(
					"assertLB",
					{
						"states": sub["states"],
						"start": sub["start"],
						"caps": subCapRef[0],
						"flags": flags,
						"_len_": lenInfo["min"],
					},
					null,
					null)
				return frag(aIdx, [ aIdx ])
			end if
		end if
	end function

	for tok in post
		if tok["kind"] == "LIT" or tok["kind"] == "DOT" or tok["kind"] == "CLASS" or tok["kind"] == "CLASS_SH" or tok["kind"] == "BOL" or tok["kind"] == "EOL" or tok["kind"] == "GROUP" or tok["kind"] == "ASSERT" then
			stack.push buildForNode(tok)
		else if tok["kind"] == "CONCAT" then
			f2 = stack.pop
			f1 = stack.pop
			patch states, f1["outs"], f2["start"]
			stack.push frag(f1["start"], f2["outs"])
		else if tok["kind"] == "ALT" then
			f2 = stack.pop
			f1 = stack.pop
			s = newState(
				"split",
				null,
				f1["start"],
				f2["start"])
			outs = []
			appendOuts outs, f1["outs"]
			appendOuts outs, f2["outs"]
			stack.push frag(s, outs)
		else if tok["kind"] == "STAR" or tok["kind"] == "PLUS" or tok["kind"] == "QMARK" or tok["kind"] == "QUANT" then
			f = stack.pop
			if tok["kind"] == "STAR" then
				s = newState(
					"split",
					null,
					f["start"],
					null)
				patch states, f["outs"], s
				stack.push frag(s, [ s ])
			else if tok["kind"] == "PLUS" then
				s = newState(
					"split",
					null,
					f["start"],
					null)
				patch states, f["outs"], s
				stack.push frag(f["start"], [ s ])
			else if tok["kind"] == "QMARK" then
				s = newState(
					"split",
					null,
					f["start"],
					null)
				stack.push frag(s, appendOuts([ s ], f["outs"]))
			else
				// {m,n}
				if tok["val"].m == null then m = 0 else m = tok["val"].m
				n = tok["val"].n // may be null (open)
				// build m copies concatenated, then add optional repeats up to n
				// we must duplicate fragment f; rebuild node tok.repr again
				// For simplicity: rebuild by re-compiling the last atom node — we can’t here.
				// Workaround: turn f into a group by adding a split->f["start"] chain builder
				baseStart = f["start"]
				baseOuts = f["outs"]
				// first, repeat m-1 times (already have one if m>0)
				totalStart = baseStart
				totalOuts = baseOuts
				count = 1
				while count < m
					splitNode = newState(
						"jmp",
						null,
						baseStart,
						null)
					patch states, totalOuts, splitNode
					totalOuts = [ splitNode ]
					count += 1
				end while

				if n == null then
					// {m,} == m mandatory + STAR
					star = newState(
						"split",
						null,
						baseStart,
						null)
					patch states, totalOuts, star
					stack.push frag(totalStart, [ star ])
				else if n == m then
					stack.push frag(totalStart, totalOuts)
				else
					// m mandatory + (n-m) optional
					k = 0
					lastOuts = totalOuts
					while k < (n - m)
						opt = newState(
							"split",
							null,
							baseStart,
							null)
						patch states, lastOuts, opt
						lastOuts = [ opt ] // both taken as outs
						k += 1
					end while
					stack.push frag(totalStart, lastOuts)
				end if
			end if
		else
			print("regex: unknown postfix token " + tok["kind"])
			exit()
		end if
	end for

	if stack.len != 1 then 
		print("regex: bad stack")
		exit()
	end if

	endIdx = newState(
		"match",
		null,
		null,
		null)
	patch states, stack[-1]["outs"], endIdx
	return {
		"states": states,
		"start": stack[-1]["start"],
	}
end function

regex._lengthOf = function(astNodes, flags)
	// returns {min:n, max:n or null}. For MVP nodes only; quantifiers with open upper bound => non-fixed.
	post = regex._toPostfix(astNodes)
	stack = []
	pushLen = function(a)
		stack.push a
	end function

	for tok in post
		if tok["kind"] == "LIT" or tok["kind"] == "DOT" or tok["kind"] == "CLASS" or tok["kind"] == "CLASS_SH" then
			pushLen {
				"min": 1,
				"max": 1,
			}
		else if tok["kind"] == "BOL" or tok["kind"] == "EOL" or tok["kind"] == "ASSERT" then
			// zero-width
			pushLen {
				"min": 0,
				"max": 0,
			}
		else if tok["kind"] == "CONCAT" then
			b = stack.pop
			a = stack.pop
			minv = a["min"] + b["min"]
			if a["max"] != null and b["max"] != null then maxv = (a["max"] + b["max"]) else maxv = null
			pushLen {
				"min": minv,
				"max": maxv,
			}
		else if tok["kind"] == "ALT" then
			b = stack.pop
			a = stack.pop
			if a["min"] < b["min"] then minv = a["min"] else minb = b["min"]

			if a["max"] == null or b["max"] == null then
				maxv = null
			else
				if a["max"] > b["max"] then maxv = a["max"] else maxv = b["max"]
			end if

			pushLen {
				"min": minv,
				"max": maxv,
			}
		else if tok["kind"] == "STAR" then
			pushLen {
				"min": 0,
				"max": null,
			}
		else if tok["kind"] == "PLUS" then
			x = stack.pop
			pushLen {
				"min": x["min"],
				"max": null,
			}
		else if tok["kind"] == "QMARK" then
			x = stack.pop
			pushLen {
				"min": 0,
				"max": x["max"],
			}
		else if tok["kind"] == "QUANT" then
			x = stack.pop

			if tok["val"].m == null then m = 0 else m = tok["val"]["m"]

			n = tok["val"].n
			if n == null then
				pushLen {
					"min": x["min"] * m,
					"max": null,
				}
			else
				pushLen {
					"min": x["min"] * m,
					"max": x["max"] * n,
				}
			end if
		else if tok["kind"] == "GROUP" then
			// recurse
			info = regex._lengthOf(tok["val"], flags)
			pushLen info
		else
			// ignore
		end if
	end for
	if stack.len == 0 then 
		return {
			"min": 0,
			"max": 0,
		}
	else
		return stack[-1]
	end if
end function

regex._addState = function(list, iState, groups, states, iText, text, flags, visited)
	// epsilon-closure walker
	stack = [ iState ]
	while stack.len > 0 
		si = stack.pop
		if visited.hasIndex(si) then continue
		visited[si] = true
		s = states[si]
		op = s["op"]
		if op == "split" then
			if s["out"] != null then stack.push(s["out"])
			if s["out2"] != null then stack.push(s["out2"])
		else if op == "jmp" then
			if s["out"] != null then stack.push(s["out"])
		else if op == "bol" or op == "eol" or op == "assertLA" or op == "assertLB" then
			// keep as active state; evaluated in step
			list.push {
				"i": si,
				"groups": groups,
			}
		else
			// char/match: leave for step
			list.push {
				"i": si,
				"groups": groups,
			}
		end if
	end while


end function

regex._step = function(curr, states, iText, text, flags)
	next = []
	ml = (flags.indexOf("m") >= 0)
	for th in curr
		si = th["i"]
		gr = th.groups
		s = states[si]
		op = s["op"]
		if op == "char" then
			if iText < text.len then ch = text[iText] else ch = null
			if regex._charMatches(s, ch) then
				visited = {}
				regex._addState(next, s["out"], gr, states, iText + 1, text, flags, visited)
				continue
			end if
			continue
		else if op == "bol" then
			if iText == 0 or (ml and iText > 0 and text[iText - 1] == "\n") then
				visited = {}
				regex._addState( next, s["out"], gr, states, iText, text, flags, visited)
				continue
			end if
		else if op == "eol" then
			if iText == text.len or (ml and iText < text.len and text[iText] == "\n") then
				visited = {}
				regex._addState( next, s["out"], gr, states, iText, text, flags, visited)
				continue
			end if
		else if op == "assertLA" then
			// run sub NFA starting from same iText; success => advance via epsilon
			sub = s["arg"]
			ok = regex._runSub( sub["states"], sub["start"], text, iText, flags)
			if ok then
				visited = {}
				regex._addState( next, s["out"], gr, states, iText, text, flags, visited)
				continue
			end if
		else if op == "assertLB" then
			sub = s["arg"]
			L = sub["_len_"]
			if iText >= L then
				ok = regex._runSub( // limit to end=iText
					sub["states"], sub["start"], text, iText - L, flags, iText)
				if ok then
					visited = {}
					regex._addState( next, s["out"], gr, states, iText, text, flags, visited)
					continue
				end if
			end if
		else if op == "match" then
			// handled by outer
			visited = {}
			regex._addState( next, si, gr, states, iText, text, flags, visited)
		end if
	end for

	return next
end function

regex._runSub = function(states, startIdx, text, startAt, flags, stopAt = null)
	// simple search: must reach "match" without reading past stopAt if provided
	curr = []
	visited = {}
	regex._addState(
		curr,
		startIdx,
		[],
		states,
		startAt,
		text,
		flags,
		visited)
	i = startAt
	while true
		// check for match state in curr
		for th in curr
			if states[th["i"]]["op"] == "match" then return true
		end for
		// advance
		if stopAt != null and i >= stopAt then return false
		if i > text.len then return false
		next = regex._step(curr, states, i, text, flags)
		if next.len == 0 then return false
		curr = next
		i += 1
	end while
end function

regex._exec = function(re, text, startIndex, anchored)
	states = re["nfa"]["states"]
	start = re["nfa"]["start"]
	flags = re["flags"]
	groupCount = re["groupCount"]

	// prepare initial groups array for captures (we’ll only fill group 0 in this MVP; structure supports more)
	makeGroups = function()
		g = []
		i = 0
		while i <= groupCount
			g.push { "s": null, "e": null }
			i += 1
		end while
		return g
	end function

	i = startIndex
	maxI = text.len 
	while i <= maxI
		if anchored and i != startIndex then return null
		// init epsilon-closure from start
		curr = []
		visited = {}
		regex._addState( curr, start, makeGroups(), states, i, text, flags, visited)
		j = i
		bestEnd = null
		bestGroups = null
		while true
			// check for match
			matched = false
			for th in curr
				if states[th["i"]]["op"] == "match" then
					matched = true
					if bestEnd == null or j < bestEnd then
						bestEnd = j
						bestGroups = th.groups
					end if
				end if
			end for
			if matched then
				// fill group 0 span
				if bestGroups != null then
					bestGroups[0]["s"] = i
					bestGroups[0]["e"] = bestEnd
				end if
				return { "ok": true, "start": i, "end": bestEnd, "groups": bestGroups }
			end if
			// advance
			if j >= text.len then break
			next = regex._step( curr, states, j, text, flags)
			if next.len == 0 then break
			curr = next
			j += 1
		end while
		if anchored then return null
		i += 1
	end while
	return null
end function

regex._replExpand = function(template, s, m)
	// support $0..$9
	out = ""
	i = 0
	while i < template.len 
		ch = template[i]
		if ch == "$" and i + 1 < template.len then 
			d = template[i + 1]
			if d >= "0" and d <= "9" then
				gi = val(d)
				if gi < m.groups.len and m.groups[gi]["s"] != null then 
					out += s[m.groups[gi]["s"] : m.groups[gi]["e"]]
				end if
				i += 2
				continue
			end if
		end if
		out += ch
		i += 1
	end while
	return out
end function

regex.compile = function(pattern, flags = "")
	// 1) tokenize
	toks = regex._tok(pattern)
	// 2) nest groups/asserts
	grouped = regex._groupify(toks)["nodes"]
	// 3) compile NFA
	capRef = [ 0 ]
	nfa = regex._compile(grouped, flags, capRef)

	return { "nfa": {"states": nfa["states"], "start": nfa["start"], }, "groupCount": capRef[0], "flags": flags}
end function

regex.match = function(re, s, start = 0)
	return regex._exec(re, s, start, true)
end function

regex.search = function(re, s, start = 0)
	return regex._exec(re, s, start, false)
end function

regex.findall = function(re, s, prototype_returnIndex=0)

	if prototype_returnIndex then
		
		out = []
		i = 0
		while i <= s.len 
			m = regex._exec(re, s, i, false)
			if m == null then break

			matchInfo = { "start": m["start"], "end": m["end"], "text": s[m["start"] : m["end"]], "groups": []}
			for g in m.groups
				if g["s"] == null then
					matchInfo["groups"].push(null)
				else
					matchInfo["groups"].push({ "start": g["s"], "end": g["e"], "text": s[g["s"] : g["e"]] })
				end if
			end for

			out.push matchInfo

			if m["end"] == i then i += 1 else i = m["end"]
		end while

		return out
	end if

	out = []
	i = 0
	while i <= s.len 
		m = regex._exec(re, s, i, false)
		if m == null then break

		row = []
		for g in m.groups
			if g["s"] == null then row.push(null) else row.push(s[g["s"] : g["e"]])
		end for

		out.push row
		if m["end"] == i then i += 1 else i = m["end"]
	end while

	return out
end function

regex.replace = function(re, s, repl, global = true)
	i = 0
	out = ""
	while true
		m = regex._exec(re, s, i, false)

		if m == null then
			out += s[i : ]
			break
		end if

		out = out + s[i : m["start"]] + regex._replExpand(repl, s, m)
		if global then
			if m["end"] == i then i += 1 else i = m["end"]
		else
			out += s[m["end"] : ]
			break
		end if

	end while

	return out
end function

regex.split = function(re, s, keepDelims = false)
	res = []
	i = 0
	last = 0
	while true
		m = regex._exec(re, s, i, false)

		if m == null then
			res.push s[last : ]
			break
		end if

		res.push s[last : m["start"]]
		if keepDelims then res.push(s[m["start"] : m["end"]])

		if m["end"] == i then i += 1 else i = m["end"]

		last = i
	end while

	return res
end function

testCalls = function()
	re = regex.compile("a")

	print("Trying: match")
	t = regex.match(re, "abra")
	print("	" +t)

	print("Trying: search")
	t = regex.search(re, "abra")
	print("	" +t)

	print("Trying: findall")
	t = regex.findall(re, "abra")
	print("	" +t)
	print("Trying: findall w+prot")
	t = regex.findall(re, "abra", 1)
	print("	" +t)

	print("Trying: replace")
	t = regex.replace(re, "abra", "o")
	print("	" +t)

	print("Trying: split")
	t = regex.split(re, "abra")
	print("	" +t)
end function

testCalls()