/* 
 * JSINQ, JavaScript integrated query
 * Copyright (c) 2009 Kai Jäger. Some rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the license.txt file. 
 */
 
 if (typeof jsinq == 'undefined') {
	jsinq = {};
 }
 
(function() {
	/**
	 * An exception that is thrown when an operation performed on an object was
	 * unsuccessful due to the state that the object was in.
	 * @constructor
	 */
	function InvalidOperationException() { }		
	InvalidOperationException.prototype = new Error();
	InvalidOperationException.prototype.name = 'InvalidOperationException';
	InvalidOperationException.prototype.message = 
		'Operation is not valid due to the current state of the object.';

	/**
	 * An exception that is thrown when the value of a parameter is outside the
	 * allowable range.
	 * @constructor
	 * @param parameter Name of the parameter that was out of range
	 */
	function ArgumentOutOfRangeException(parameter) { 
		this.message += parameter;
	}
	ArgumentOutOfRangeException.prototype = new Error();
	ArgumentOutOfRangeException.prototype.name = 'ArgumentOutOfRangeException';
	ArgumentOutOfRangeException.prototype.message = 
		'Specified argument was out of the range of valid values.\r\n' +
		'Parameter name: ';

	/**
	 * Provides a method to support the comparison of two objects for equality.
	 * @constructor
	 */
	function EqualityComparer() { }
	EqualityComparer.prototype = {
		/**
		 * Returns true if a and b are equal.
		 * @param a The first object
		 * @param b The second object
		 * @return True if a and b are equal
		 */
		equals: function(a, b) {
			return a == b;
		}	
	};

	(function() {
		var defaultComparer = new EqualityComparer();
		/**
		 * Returns the default comparer which uses JavaScript's built-in non-
		 * strict equals-operator to compare two values for equality.
		 * @return The default comparer
		 */
		EqualityComparer.getDefault = function() {
			return defaultComparer;
		};
	})();		

	/**
	 * Provides a method to support the comparison of two objects.
	 * @constructor
	 */
	function Comparer() { }
	Comparer.prototype = {
		/**
		 * Returns a value less than zero if a is less than b, a value greater 
		 * zero if a is greater than b and zero if a equals b.
		 * @param a The first object
		 * @param b The second object
		 * @return A value indicating whether a is equal to, less than or
		 * 	greater than b
		 */
		compare: function(a, b) {
			return a < b ? -1 : (a > b ? 1 : 0);
		}
	};

	(function() {
		var defaultComparer = new Comparer();
		/**
		 * Returns the default comparer which uses JavaScript's built-in less-
		 * than and greater-than operators to compare two values.
		 * @return The default comparer
		 */
		Comparer.getDefault = function() {
			return defaultComparer;
		};
	})();	

	/**
	 * Gives access to an Enumerator that can be used to enumerate the object.
	 * Invoke this constructor with either a scalar value to create a singleton
	 * list or with an array or a NodeList to make it enumerable.
	 * @constructor
	 * @param value The object to enumerate
	 */
	function Enumerable(value) {	
		if (arguments.length == 0) {
			value = [];
		} else if (typeof value.length == 'undefined' || (value.length > 0 && 
			typeof value[0] == 'undefined')) {
			value = [value];
		}
		
		/**
		 * Returns a new Enumerator
		 * @return A new enumerator
		 */
		this.getEnumerator = function() {
			return new function() {
				var index = -1;
						
				/**
				 * Moves the internal cursor to the next value. Returns false 
				 * if the cursor has been moved past the end of the collection.
				 * @return False if the cursor has been moved past the end of 
				 * 	the collection
				 */
				this.moveNext = function() {
					++index;
					return index < value.length;
				};					
							
				/**
				 * Returns the element in the collection that the internal  
				 * cursor currently points to. Make sure to call moveNext 
				 * before calling current. When calling current after an 
				 * unsuccessful call to moveNext, the method will throw an 
				 * exception.
				 * @return The current element
				 */
				this.current = function() {
					if (index < 0 || index >= value.length) {
						throw new InvalidOperationException();
					}
					return value[index];
				};	
						
				/**
				 * Places the internal cursor before the first element in the 
				 * collection.
				 */
				this.reset = function() {
					index = -1;
				};									
			};
		};
	}

	/**
	 * Returns an empty Enumerable
	 * @return An empty Enumerable
	 */
	Enumerable.empty = function() {	
		return new Enumerable();
	};

	/**
	 * Returns an Enumerable for the specified range of numbers
	 */
	Enumerable.range = function(start, count) {
		if (count < 0) {
			throw new ArgumentOutOfRangeException();
		}
		var func = function() {
			this.getEnumerator = function() {
				return new function() {
					var index = -1;
					var hasNext = false;
					this.moveNext = function() {
						hasNext = false;
						if (index < count - 1) {
							hasNext = true;
							++index;
							return true;
						}
						return false;
					};
					
					this.current = function() {
						if (hasNext) {
							return start + index;
						} else {
							throw new InvalidOperationException();	
						}
					};	
					
					this.reset = function() { 
						index = -1;
					};
				};
			};
		};
		func.prototype = Enumerable.prototype;
		return new func();
	};

	/**
	 * Returns an Enumerable that contains the specified element "count" times
	 */
	Enumerable.repeat = function(element, count) {
		if (count < 0) {
			throw new ArgumentOutOfRangeException();	
		}
		var func = function() {
			this.getEnumerator = function() {
				return new function() {
					var index = -1;
					var hasNext = false;
					this.moveNext = function() {
						hasNext = false;
						if (index < count - 1) {
							hasNext = true;
							++index;
							return true;
						}
						return false;
					};
					
					this.current = function() {
						if (hasNext) {
							return element;
						} else {
							throw new InvalidOperationException();	
						}
					};	
					
					this.reset = function() { 
						index = -1;
						hasNext = false;
					};
				};
			};
		};
		func.prototype = Enumerable.prototype;
		return new func();
	};

	Enumerable.prototype = (function() {
		// Identity function used as a default value for certain method 
		// overloads. See below.
		function identity(value) {
			return value;
		}
					
		// An associative container that maintains a list of key-value pairs.
		// Since JavaScript's built-in associative arrays do not properly 
		// support complex types as keys and also lack support for custom 
		// comparators, this container is used instead.
		// Todo: This is really slow when using complex types as keys.
		function Hash(comparer) {
			if (arguments.length == 0 || 
				arguments[0] == EqualityComparer.getDefault()) {
				this.comparer = null;
			}
			this.comparer = arguments[0];
			this.primitiveItems = {};
			this.complexItems = [];
		}
		Hash.prototype = {
			lookUp: function(key, func) {
				var funcResult;
				
				// Primitive keys are kept in an associative array, complex 
				// keys in a linear array
				if (this.comparer == null && (typeof key == 'string' || 
					typeof key == 'number' || typeof key == 'boolean' || 
					typeof key == 'null')) {
					var value = this.primitiveItems[key];
					if (typeof value != 'undefined') {
						funcResult = func(value);							
					} else {
						funcResult = func();
					}						
					if (funcResult.length > 1) {
						this.primitiveItems[key] = funcResult[1];
					}						
					return funcResult[0];
				} else {
					var length = this.complexItems.length;
					var item;
					for (var i = 0; i < length; i++) {
						item = this.complexItems[i];
						if ((this.comparer != null && 
							this.comparer.equals(item.key, key)) ||
							(this.comparer == null && item.key == key)) {
							funcResult = func(item.element);
							if (funcResult.length > 1) {
								item.element = funcResult[1];
							}
							return funcResult[0];
						}
					}
					funcResult = func();
					if (funcResult.length > 1) {
						this.complexItems.push({key: key, 
							element: funcResult[1]});
					}
					return funcResult[0];
				}					
			},
			keyExists: function(key) {
				return this.lookUp(key, function(value) {
					return [arguments.length == 1];
				});	
			},
			get: function(key) {
				return this.lookUp(key, function(value) {
					if (arguments.length == 0) {
						throw false;	
					}
					return [value];
				});											
			},
			put: function(key, newValue, overwrite) {
				if (arguments.length < 3) {
					overwrite = false;
				}
				return this.lookUp(key, function(value) {
					if (arguments.length == 0 || overwrite) {
						return [true, newValue];
					} else {
						return [false];
					}
				});							
			},
			toArray: function() {
				var result = [];
				for (var key in this.primitiveItems) {
					result.push({key: key, element: this.primitiveItems[key]});
				}
				return result.concat(this.complexItems);
			},
			empty: function() {
				this.primitiveItems = {};
				this.complexItems = [];
			}
		};
		
		// The two possible parameters for the orderBy function (see below)
		var ASCENDING = 1;
		var DESCENDING = -1;
		
		// Implementation of Enumerable.orderBy, Enumerable.orderByDescending 
		// as well as OrderedEnumerable.thenBy and 
		// OrderedEnumerable.thenByDescending. This is implemented here, to 
		// avoid code duplication. The function returns a different 
		// implementation of the orderBy function based on the direction 
		// parameter.
		function orderBy(direction) {
			return function(keySelector) {
				var _this = this;
				var parentSelectors = [];
				var comparer = Comparer.getDefault();
				if (arguments.length >= 3) {
					comparer = arguments[1];
					parentSelectors = arguments[2];
				}	else if (arguments.length >= 2) {
					if (arguments[1] instanceof Array) {
						parentSelectors = arguments[1];
					} else {
						comparer = arguments[1];
					}
				}			
				var selectors = [[keySelector, direction, comparer]];
				selectors = selectors.concat(parentSelectors);
				
				var func = function() {
					this.getEnumerator = function() {						
						return new function() {
							var itemEnumerator = null;
							
							function lazyInitialize() {
								var array = _this.toArray();
								array.sort(function(a, b) {
									var result = 0;
									var selector;
									var direction;
									var comparer;
									// Go through all selectors
									for (var i = selectors.length - 1; 
										i >= 0; i--) {
										result = 0;
										selector = selectors[i][0];
										direction = selectors[i][1];
										comparer = selectors[i][2];
										var keyA = selector(a);
										var keyB = selector(b);
										var compareResult = comparer.compare(
											keyA, keyB);
										if (compareResult != 0) {										
											return compareResult * direction;
										}																	
									}
									return 0;
								});
								itemEnumerator = (new Enumerable(array)).
									getEnumerator();
							}
							
							this.moveNext = function() {
								if (itemEnumerator == null) {
									lazyInitialize();
								}
								return itemEnumerator.moveNext();
							};
							
							this.current = function() {
								if (itemEnumerator == null) {
									throw new InvalidOperationException();
								}	
								return itemEnumerator.current();
							};
							
							this.reset = function() {
								if (itemEnumerator != null) {
									itemEnumerator.reset();
								}
							};
						};
					};
					
					// To avoid having to sort the Enumerable multiple times, 
					// thenBy does not actually perform any sorting at all. 
					// Instead, a chain of orderBy and thenBys essentially 
					// becomes an array of selectors. ThenBy then bypasses the 
					// previous orderBy and thenBys and returns a new 
					// Enumerator that sorts the original (unsorted) Enumerable
					// directly using the array of selectors (See above).
					this.thenBy = function(keySelector, comparer) {	
						var orderByFunc = orderBy(ASCENDING);
						if (arguments.length < 2) {
							comparer = Comparer.getDefault();
						}
						return orderByFunc.call(_this, keySelector, comparer, 
							selectors);
					};
					
					this.thenByDescending = function(keySelector, comparer) {
						var orderByFunc = orderBy(DESCENDING);
						if (arguments.length < 2) {
							comparer = Comparer.getDefault();
						}
						return orderByFunc.call(_this, keySelector, comparer, 
							selectors);		
					};
				};	
				func.prototype = Enumerable.prototype;
				return new func();				
			};
		}
		
		// Implementation of Enumerable.join and Enumerable.groupJoin. Again, 
		// this helps in avoiding code-duplication.
		function join(group) {
			return function (second, outerKeySelector, innerKeySelector, 
				resultSelector, comparer) {
				var _this = this;
				if (arguments.length < 5) {
					comparer = EqualityComparer.getDefault();
				}
				
				var func = function() {
					this.getEnumerator = function() {
						return new function() {
							var hash = null;
							var enumerator = _this.getEnumerator();
							var hasNext = false;
							var firstElement;
							var secondElement;
							var secondList = null;
							var index = -1;
							
							function lazyInitialize() {
								hash = new Hash(comparer);
								var secondEnumerator = second.getEnumerator();
								while (secondEnumerator.moveNext()) {
									var current = secondEnumerator.current();
									var key = innerKeySelector(current);
									if (!hash.put(key, [current])) {
										var array = hash.get(key);
										array.push(current);
									}
								}
							}
							
							this.moveNext = function() {
								if (hash == null) {
									lazyInitialize();	
								}		
								var current;
								var key;
								if (group) {
									hasNext = enumerator.moveNext();
									if (hasNext) {										
										current = enumerator.current();
										key = outerKeySelector(current);
										firstElement = current;
										if (hash.keyExists(key)) {
											secondElement = new Enumerable(
												hash.get(key));
										} else {
											secondElement = Enumerable.empty();
										}
									}
								} else {
									if (secondList != null && ++index < 
										secondList.length) {
										secondElement = secondList[index];
										hasNext = true;
									} else {
										hasNext = false;
										while (enumerator.moveNext()) {
											current = enumerator.current();
											key = outerKeySelector(current);
											if (hash.keyExists(key)) {
												secondList = hash.get(key);
												secondElement = secondList[0];
												index = 0;
												hasNext = true;
												firstElement = current;
												break;
											} else {
												continue;
											}														
										}
									}
								}
								return hasNext;
							};
							
							this.current = function() {
								if (!hasNext) {
									throw new InvalidOperationException();
								}
								return resultSelector(firstElement, 
									secondElement);
							};
							
							this.reset = function() {
								enumerator.reset();
							};
						};	
					};	
				};
				func.prototype = Enumerable.prototype;
				return new func();
			};
		}
		
		return {
			/**
			 * Accumulates the elements of an Enumerable using an accumulator 
			 * function. 
			 *
			 * Overloads:
			 *   aggregate(func)
			 *   aggregate(seed, func)
			 *   aggregate(seed, func, resultSelector)
			 */
			aggregate: function() {
				var enumerator = this.getEnumerator();
				
				if (!enumerator.moveNext()) {
					throw new InvalidOperationException();
				}						
				
				var running;
				var func;
				var resultSelector = identity;
				if (arguments.length >= 2) {
					running = arguments[0];
					func = arguments[1];
					if (arguments.length >= 3) {
						resultSelector = arguments[2];
					}
					enumerator.reset();
				} else {
					func = arguments[0];		
					running = enumerator.current();
				}
				while (enumerator.moveNext()) {
					running = func(running, enumerator.current());
				} 
				return resultSelector(running);
			},
			
			/**
			 * Returns true if all elements in the Enumerable satisfy the 
			 * specified condition.
			 */
			all: function(predicate) {		
				var enumerator = this.getEnumerator();
				while (enumerator.moveNext()) {
					if (!predicate(enumerator.current())) {
						return false;
					}
				}				
				return true;
			},
			
			/**
			 * Returns true if the Enumerable contains any elements or if at  
			 * least one of the elements in the Enumerable satisfy a specified 
			 * condition.
			 *
			 * Overloads:
			 *   any()
			 *   any(predicate)
			 */		
			any: function(predicate) {
				var enumerator = this.getEnumerator();
				if (arguments.length == 0) {
					return enumerator.moveNext();
				}
				var array = [];
				while (enumerator.moveNext()) {
					if (predicate(enumerator.current())) {
						return true;
					}
				}				
				return false;					
			},
			
			/**
			 * Returns the average of the elements in the Enumerable, 
			 * optionally using the specified selector function.
			 *
			 * Overloads:
			 *   average()
			 *   average(selector)
			 */		
			average: function(selector) {
				if (arguments.length == 0) {
					selector = identity;
				}
				var count = 0;
				var sum = this.aggregate(0, function(running, current) {
					++count;	
					return running + selector(current);
				});
				return sum / count;
			},
			
			/**
			 * Creates a new Enumerable that is the result of the concatenation
			 * of two Enumerables.
			 */		
			concat: function(second) {
				var _this = this;
				var func = function() {
					this.getEnumerator = function() {
						return new function() {
							var firstEnumerator = _this.getEnumerator();
							var secondEnumerator = second.getEnumerator();
							var enumerator = firstEnumerator;
							var canSwap = true;
							this.moveNext = function() {
								if (!enumerator.moveNext()) {
									if (canSwap) {
										enumerator = secondEnumerator;
										return enumerator.moveNext();
									}
									return false;
								}
								return true;
							};
							
							this.current = function() {
								return enumerator.current();
							};			
							
							this.reset = function() {
								canSwap = true;
								firstEnumerator.reset();
								secondEnumerator.reset();
								enumerator = firstEnumerator;
							};		
						};
					};
				};
				func.prototype = Enumerable.prototype;
				return new func();			
			},
			
			/**
			 * Returns true if the Enumerable contains the specified element.
			 * Optionally uses the specified comparer.
			 * 
			 * Overloads:
			 *   contains(value)
			 *   contains(value, comparer)
			 */		
			contains: function(value, comparer) {
				if (arguments.length == 1) {
					comparer = EqualityComparer.getDefault();
				}
				return this.any(function(item) {
					return comparer.equals(item, value);
				});		
			},
			
			/**
			 * Returns the number of elements in the Enumerable. If a predicate
			 * function is specified, only those elements will be counted that
			 * satisfy the given condition.
			 */		
			count: function(predicate) {
				var count = 0;
				var enumerator = this.getEnumerator();
				var hasPredicate = typeof predicate == 'function';
				while (enumerator.moveNext()) {
					if ((hasPredicate && predicate(enumerator.current())) || 
						!hasPredicate) {
						++count;
					}						
				}				
				return count;
			},				
			
			/**
			 * Returns the Enumerable or a new Enumerable containing only the 
			 * specified default value, should the Enumerable be empty.
			 */		
			defaultIfEmpty: function(defaultValue) {
				var isEmpty = !this.any(function(item) {
					return true;
				});						
				if (isEmpty) {
					return new Enumerable(defaultValue);
				}
				return this;
			},
			
			/**
			 * Returns a new Enumerable that contains only distinct elements.
			 * Optionally uses a specified comparer.
			 *
			 * Overloads:
			 *   distinct()
			 *   distinct(comparer)
			 */		
			distinct: function(comparer) {
				var _this = this;					
				var hasComparer = arguments.length > 0;
				
				var func = function() {
					this.getEnumerator = function() {
						return new function() {
							var enumerator = _this.getEnumerator();
							var hash;
							if (hasComparer) {	
								hash = new Hash(comparer);
							} else {
								hash = new Hash();
							}			
								
							this.moveNext = function() {
								while (enumerator.moveNext()) {
									if (hash.put(enumerator.current(), true)) {
										return true;											
									}
								}
								return false;
							};
							
							this.current = function() {
								return enumerator.current();
							};			
							
							this.reset = function() {
								enumerator.reset();
								hash.empty();
							};		
						};
					};
				};
				func.prototype = Enumerable.prototype;
				return new func();	
			},
			
			/**
			 * Returns the element at the specified offset or throws an 
			 * exception if the index is out of bounds.
			 */		
			elementAt: function(index) {
				var element;
				var found = this.any(function(item) {
					element = item;
					return index-- == 0;
				});	
				if (!found) {
					throw new ArgumentOutOfRangeException('index');
				}
				return element;
			},
			
			/**
			 * Same as elementAt, except it returns the specified defaultValue 
			 * if the given index is out of bounds. This differs from the LINQ 
			 * implementation in that the default value needs to be specified 
			 * explicitly.
			 */		
			elementAtOrDefault: function(index, defaultValue) {
				try {
					return this.elementAt(index);
				} catch (e) {
					return defaultValue;
				}	
			},
			
			/**
			 * Returns a new Enumerable containing all elements from this 
			 * Enumerable except those contained in a second Enumerable (i.e. 
			 * the set difference between two enumerables). Optionally uses the 
			 * specified comparer.
			 *
			 * Overloads:
			 *   except(second)
			 *   except(second, comparer)
			 */		
			except: function(second, comparer) {
				if (arguments.length < 2) {
					comparer = EqualityComparer.getDefault();
				}
				return this.where(function(item) {
					return !second.any(function(compare) {
						return comparer.equals(item, compare);
					});
				});	
			},
			
			/**
			 * Returns the first element in the Enumerable or throws an 
			 * exception if the Enumerable is empty. If a predicate function 
			 * is specified, the method returns the first element that 
			 * satisfies the given condition. If the Enumerable is empty or no 
			 * element satisfies the specified condition, an exception is 
			 * thrown.
			 *
			 * Overloads:
			 *   first()
			 *   first(predicate)
			 */		
			first: function(predicate) {
				if (arguments.length == 0) {
					try {
						return this.elementAt(0);
					} catch (e) {
						throw new InvalidOperationException();	
					}
				} else {
					var element;
					var found = this.any(function(item) {
						if (predicate(item)) {
							element = item;
							return true;
						}
						return false;
					});
					if (!found) {
						throw new InvalidOperationException();
					}
					return element;
				}
			},
			
			/**
			 * Same as first, except it returns a specified defaultValue if 
			 * the Enumerable is empty or no element satisfies the specified 
			 * condition. This method is different from its LINQ counterpart 
			 * in that it requires the default value to be specified 
			 * explicitly.
			 *
			 * Overloads:
			 *   firstOrDefault(defaultValue)
			 *   firstOrDefault(predicate, defaultValue)
			 */		
			firstOrDefault: function() {
				if (arguments.length == 1) {
					var defaultValue = arguments[0];	
				} else if (arguments.length > 1) {
					var predicate = arguments[0];
					var defaultValue = arguments[1];
				}
				try {
					if (arguments.length > 1) {
						return this.first(predicate);
					} else {
						return this.first();
					}
				} catch (e) {
					return defaultValue;
				}						
			},
			
			/**
			 * Groups the elements in the Enumerable. Note that this method  
			 * resolves overloads based on function arity. Result selectors 
			 * are expected to have two or more formal parameters while 
			 * element- and key-selectors are expected to have just one.
			 *
			 * Overloads:
			 *   groupBy(keySelector)
			 *   groupBy(keySelector, comparer)
	 		 *   groupBy(keySelector, elementSelector)
			 *   groupBy(keySelector, resultSelector)
	 		 *   groupBy(keySelector, resultSelector, comparer)
			 *   groupBy(keySelector, elementSelector, comparer) 		 
			 *   groupBy(keySelector, elementSelector, resultSelector) 	
			 *   groupBy(keySelector, elementSelector, resultSelector, 
			 *           comparer) 	
			 */		
			groupBy: function() {
				var keySelector = arguments[0];
				var elementSelector = identity;
				var resultSelector = identity;
				var comparer = EqualityComparer.getDefault();
				
				// Resolve overloads
				// Todo: Dealing with overloads based on function arity is  
				// probably a bad idea. Maybe there is a better way?
				if (arguments.length == 2) {
					if (typeof arguments[1].equals == 'function') {
						comparer = arguments[1];
					} else if (arguments[1].arity >= 2) {
						resultSelector = arguments[1];
					} else {
						elementSelector = arguments[1];
					}
				} else if (arguments.length == 3) {
					if (arguments[1].arity >= 2) {
						resultSelector = arguments[1];
						comparer = arguments[2];
					} else {
						elementSelector = arguments[1];
						if (typeof arguments[2].equals == 'function') {
							comparer = arguments[2];
						} else {
							resultSelector = arguments[2];
						}
					}
				} else if (arguments.length > 3) {
					elementSelector = arguments[1];
					resultSelector = arguments[2];
					comparer = arguments[3];
				}
				
				var _this = this;
				
				var func = function() {
					this.getEnumerator = function() {
						return new function() {
							var resultSet = null;
							var index = -1;
							
							function lazyInitialize() {
								var itemEnumerator = _this.getEnumerator();
								var hash = new Hash(comparer);
								
								while (itemEnumerator.moveNext()) {
									var current = itemEnumerator.current();
									var key = keySelector(current);	
									if (hash.keyExists(key)) {
										var array = hash.get(key);
										array.push(elementSelector(current));
									} else {
										hash.put(key, 
											[elementSelector(current)]);
									}
								}									
								resultSet = hash.toArray();
							}
							
							this.moveNext = function() {
								if (resultSet == null) {
									lazyInitialize();
								}
								++index;
								return index < resultSet.length;
							};
							
							this.current = function() {
								if (index < 0 || index >= resultSet.length) {
									throw new InvalidOperationException();
								}
								var current = resultSet[index];
								var elements = new Enumerable(
									current.element);
								if (resultSelector != identity) {		
									return resultSelector(current.key, 
										elements);
								} else {			
									var Grouping = function(key, elements) {
										this.getKey = function() {
											return key;
										};
										
										this.getEnumerator = function() {
											return elements.getEnumerator();	
										};
									};
									Grouping.prototype = Enumerable.prototype;
									return new Grouping(current.key, 
										elements);
								}
							};
							
							this.reset = function() {
								index = -1;
							};
						};
					};
				};
				func.prototype = Enumerable.prototype;
				return new func();
			},
			
			/**
			 * Correlates the elements in two Enumerables based on their keys 
			 * and groups the results. 
			 *
			 * Overloads:
			 *   groupJoin(inner, outerKeySelector, innerKeySelector, 
			 *             resultSelector)
			 *   groupJoin(inner, outerKeySelector, innerKeySelector, 
			 *             resultSelector, comparer)
			 */		
			groupJoin: join(true),
			
			/**
			 * Returns a new Enumerable that is the result of the intersection
			 * of two Enumerables. Optionally uses the specified comparer.
			 * 
			 * Overloads:
			 *   intersect(second)
			 *   intersect(second, comparer)
			 */		
			intersect: function(second, comparer) {
				if (arguments.length < 2) {
					comparer = EqualityComparer.getDefault();
				}
				return this.distinct(comparer).where(function(item) {
					return second.contains(item, comparer);
				});
			},
			
			/**
			 * Correlates the elements in two Enumerables based on their 
			 * keys. 
			 *
			 * Overloads:
			 *   join(inner, outerKeySelector, innerKeySelector, 
			 *        resultSelector)
			 *   join(inner, outerKeySelector, innerKeySelector, 
			 *        resultSelector, comparer)
			 */		
			join: join(false),
			
			/**
			 * Returns the last element in the Enumerable or throws an 
			 * exception, if the Enumerable is empty. If a predicate function 
			 * is specified, the method returns the last element that 
			 * satisfies the given condition. If no element satisfies the 
			 * specified condition, an exception is thrown.
			 *
			 * Overloads:
			 *   last()
			 *   last(predicate)
			 */		
			last: function(predicate) {
				var hasPredicate = typeof predicate == 'function';
				
				var last;
				var isEmpty = true;
				this.any(function(item) {
					if (!hasPredicate || predicate(item)) {
						last = item;
						isEmpty = false;
					}
					return false;	
				});					
				
				if (isEmpty) {
					throw new InvalidOperationException();	
				}				
				return last;
			},
			
			/**
			 * Same as last, except it returns a specified defaultValue if the
			 * Enumerable is empty or not element satisfies the specified 
			 * condition. This method is different from its LINQ counterpart 
			 * in that it requires the default value to be specified 
			 * explicitly.
			 *
			 * Overloads:
			 *   lastOrDefault(defaultValue)
			 *   lastOrDefault(predicate, defaultValue)
			 */		
			lastOrDefault: function() {
				if (arguments.length == 1) {
					var defaultValue = arguments[0];	
				} else if (arguments.length > 1) {
					var predicate = arguments[0];
					var defaultValue = arguments[1];
				}
				try {
					if (arguments.length > 1) {
						return this.last(predicate);
					} else {
						return this.last();
					}
				} catch (e) {
					return defaultValue;
				}						
			},
			
			/**
			 * Returns the maximum value in the Enumerable.
			 * 
			 * Overloads:
			 *   max()
			 *   max(selector)
			 */		
			max: function(selector) {
				if (arguments.length == 0) {
					selector = identity;
				}
				var isFirst = true;
				return this.aggregate(function(running, current) {
					if (isFirst) {
						running = selector(running);
						isFirst = false;
					}
					return Math.max(running, selector(current));
				});
			},
			
			/**
			 * Returns the minimum value in the Enumerable.
			 * 
			 * Overloads:
			 *   min()
			 *   min(selector)
			 */		
			min: function(selector) {
				if (arguments.length == 0) {
					selector = identity;
				}
				var isFirst = true;
				return this.aggregate(function(running, current) {
					if (isFirst) {
						running = selector(running);
						isFirst = false;
					}
					return Math.min(running, selector(current));
				});
			},	
			
			/**
			 * Sorts the elements in the Enumerable in ascending order.
			 *
			 * Overloads:
			 *   orderBy(keySelector)
			 *   orderBy(keySelector, comparer)
			 */		
			orderBy: orderBy(ASCENDING),
			
			/**
			 * Sorts the elements in the Enumerable in descending order.
			 *
			 * Overloads:
			 *   orderByDescending(keySelector)
			 *   orderByDescending(keySelector, comparer)
			 */	
			orderByDescending: orderBy(DESCENDING),							
			
			/**
			 * Reverses the order of the elements in the Enumerable.
			 */		
			reverse: function() {
				var _this = this;
				var func = function() {
					this.getEnumerator = function() {
						return new function() {
							var enumerator = null;
							
							this.moveNext = function() {
								if (enumerator == null) {
									enumerator = new Enumerable(
										_this.toArray().reverse()).
										getEnumerator();
								}
								return enumerator.moveNext();
							};
							
							this.current = function() {
								if (enumerator == null) {
									throw new InvalidOperationException();
								}
								return enumerator.current();
							};
							
							this.reset = function() {
								if (enumerator != null) {
									enumerator.reset();
								}							
							};
						};
					}
				};
				func.prototype = Enumerable.prototype;
				return new func();			
			},
			
			/**
			 * Projects each of the elements in the Enumerable into a new 
			 * form. This differes from its LINQ counterpart in that the 
			 * selector function always receives the index of the current  
			 * element as its second parameter.
			 */		
			select: function(selector) {
				var _this = this;
				var func = function() {
					this.getEnumerator = function() {
						return new function() {
							var itemEnumerator = _this.getEnumerator();
							var index = -1;
							
							this.moveNext = function() {
								++index;
								return itemEnumerator.moveNext();							
							};
							
							this.current = function() {
								return selector(itemEnumerator.current(), 
									index);
							};			
							
							this.reset = function() {
								itemEnumerator.reset();
								index = -1;
							};		
						};
					};
				};
				func.prototype = Enumerable.prototype;
				return new func();
			},
			
			/**
			 * Projects each of the elements in the Enumerable into a new 
			 * Enumerable and then flattens the result into a single  
			 * Enumerable again. This differes from its LINQ counterpart in  
			 * that the collection selector function always receives the 
			 * index of the current element as its second parameter.
			 *
			 * Overloads:
			 *   selectMany(selector)
			 *   selectMany(collectionSelector, resultSelector)
			 */		
			selectMany: function(collectionSelector, resultSelector) {
				var hasResultSelector = arguments.length > 1;
				var _this = this;
				var func = function() {	
					this.getEnumerator = function() {
						return new function() {
							var itemEnumerator = _this.getEnumerator();
							var item = null;
							var subItemEnumerator = null;
							var hasCurrent = false;
							var index = 0;
				
							this.moveNext = function() {
								hasCurrent = false;
								var noMoveNext = true;
								while (true) {
									if (subItemEnumerator == null || 
										!subItemEnumerator.moveNext()) {
										if (!itemEnumerator.moveNext()) {										
											break;
										}
										item = itemEnumerator.current();
										subItemEnumerator = 
											collectionSelector(item, index++).
											getEnumerator();
										noMoveNext = false;
									}		
									if (noMoveNext || 
										subItemEnumerator.moveNext()) {
										hasCurrent = true;
										break;
									}
								}	
								return hasCurrent;
							};
								
							this.current = function() {
								if (!hasCurrent) {
									throw new InvalidOperationException();
								}
								if (hasResultSelector) {
									return resultSelector(item, 
										subItemEnumerator.current());
								} else {
									return subItemEnumerator.current();
								}
							};
							
							this.reset = function() {
								hasCurrent = false;
								subItemEnumerator = null;
								item = null;
								itemEnumerator.reset();
								index = 0;
							};
						};
					};
				};	
				func.prototype = Enumerable.prototype;
				return new func();
			},		
			
			/**
			 * Returns true if the Enumerable is identical to another 
			 * Enumerable by comparing the elements using an optional 
			 * comparer.
			 *
			 * Overloads:
			 *   sequenceEqual(second)
			 *   sequenceEqual(second, comparer)
			 */		
			sequenceEqual: function(second, comparer) {
				if (this == second) {
					return true;
				}
				if (arguments.length < 2) {
					comparer = EqualityComparer.getDefault();
				}					
				var firstEnumerator = this.getEnumerator();
				var secondEnumerator = second.getEnumerator();
				
				while (firstEnumerator.moveNext() && 
					secondEnumerator.moveNext()) {
					if (!comparer.equals(firstEnumerator.current(), 
						secondEnumerator.current())) {
						return false;
					}
				}					
				return true;
			},
			
			/**
			 * Returns the only element in the Enumerable or throws an  
			 * exception either if the Enumerable is empty or if there is more 
			 * than one element in the Enumerable. Optionally tests the 
			 * returned element against a predicate function and throws an 
			 * exception if the element does not satisfy its condition.
			 *
			 * Overloads:
			 *   single()
			 *   single(predicate)
			 */		
			single: function(predicate) {
				var hasPredicate = arguments.length > 0;
				var enumerator = this.getEnumerator();
				if (!enumerator.moveNext()) {
					throw new InvalidOperationException();	
				} 
				var current = enumerator.current();
				if (enumerator.moveNext() || (hasPredicate && 
					!predicate(current))) {
					throw new InvalidOperationException();	
				}
				return current;
			},
			
			/**
			 * Same as single, except that a specified default value is 
			 * returned if the Enumerable is empty, contains more than one 
			 * element or if the element does not satisfy the specified 
			 * condition. This method differs from its LINQ counterpart in 
			 * that it requires the default value to be specified explicitly.
			 *
			 * Overloads:
			 *   singleOrDefault(defaultValue)
			 *   singleOrDefault(predicate, defaultValue)
			 */		
			singleOrDefault: function() {
				if (arguments.length == 1) {
					var defaultValue = arguments[0];	
				} else if (arguments.length > 1) {
					var predicate = arguments[0];
					var defaultValue = arguments[1];
				}
				try {
					if (arguments.length > 1) {
						return this.single(predicate);
					} else {
						return this.single();
					}
				} catch (e) {
					return defaultValue;
				}									
			},
			
			/**
			 * Returns a new Enumerable that is the result of skipping the 
			 * first "count" elements of the Enumerable.     
			 */		
			skip: function(count) {
				if (count == 0) {
					return this;
				}
				return this.skipWhile(function(item, index) {
					return index < count;
				});
			},
			
			/**
			 * Returns a new Enumerable that is the result of skipping all 
			 * elements from the beginning of the Enumerable that satisfy a  
			 * specified condition.
			 */		
			skipWhile: function(predicate) {
				var _this = this;
				var func = function() {
					this.getEnumerator = function() {
						return new function() {
							var enumerator = _this.getEnumerator();
							var isInitialized = false;
							var index = 0;
														
							this.moveNext = function() {
								if (!isInitialized) {
									var canMoveNext = false;
									while ((canMoveNext = 
										enumerator.moveNext()) &&
										predicate(enumerator.current(), 
										index++)) { }
									isInitialized = true;
									return canMoveNext;
								} else {
									return enumerator.moveNext();
								}
							};
							
							this.current = function() {
								return enumerator.current();
							};
							
							this.reset = function() {
								enumerator.reset();
								isInitialized = false;
								index = 0;
							};
						};
					};
				};	
				func.prototype = Enumerable.prototype;
				return new func();					
			},
			
			/**
			 * Returns the sum of the elements in the Enumerable, optionally 
			 * using a specified selector.
			 *
			 * Overloads:
			 *   sum()
			 *   sum(selector)
			 */		
			sum: function(selector) {
				if (arguments.length == 0) {
					selector = identity;
				}
				return this.aggregate(0, function(running, current) {
					return running + selector(current);
				});
			},		
			
			/**
			 * Returns a new Enumerable that is the result of extracting the 
			 * first "count" elements from the Enumerable.
			 */		
			take: function(count) {
				if (count == 0) {
					return Enumerable.empty();
				}
				return this.takeWhile(function(item, index) {
					return index < count;
				});					
			},		
			
			/**
			 * Returns a new Enumerable that is the result of extracting all 
			 * elements from the beginning of the Enumerable that satisfy the  
			 * specified condition.
			 */		
			takeWhile: function(predicate) {
				var _this = this;
				var func = function() {
					this.getEnumerator = function() {
						return new function() {
							var enumerator = _this.getEnumerator();
							var isOperational = true;
							var index = 0;
														
							this.moveNext = function() {
								if (isOperational) {
									isOperational = enumerator.moveNext() && 
										predicate(enumerator.current(), 
										index++);
								}
								return isOperational;
							};
							
							this.current = function() {
								if (!isOperational) {
									throw new InvalidOperationException();
								}
								return enumerator.current();
							};
							
							this.reset = function() {
								enumerator.reset();
								isOperational = true;
								index = 0;
							};
						};
					};
				};	
				func.prototype = Enumerable.prototype;
				return new func();						
			},
			
			/**
			 * Returns an array containg all the elements in Enumerable.
			 */		
			toArray: function() {
				var enumerator = this.getEnumerator();
				var array = [];
				while (enumerator.moveNext()) {
					array.push(enumerator.current());
				}				
				return array;
			},
			
			/**
			 * Returns a new Enumerable that is the union of two Enumerables. 
			 * Optionally uses the specified comparer.
			 *
			 * Overloads:
			 *   union(second)
			 *   union(second, comparer)
			 */		
			union: function(second, comparer) {
				if (arguments.length < 2) {
					comparer = EqualityComparer.getDefault();
				}
				return this.concat(second).distinct(comparer);
			},
			
			/**
			 * Returns a new Enumerable that contains only the elements of the
			 * Enumerable that satisfy the specified condition.
			 */		
			where: function(predicate) {
				var _this = this;
				var func = function() {
					this.getEnumerator = function() {
						return new function() {
							var itemEnumerator = _this.getEnumerator();
							var current;
							var hasCurrent = false;
							this.moveNext = function() {
								hasCurrent = false;
								while (itemEnumerator.moveNext()) {
									current = itemEnumerator.current();
									if (predicate(current)) {
										hasCurrent = true;
										break;
									}
								}
								return hasCurrent;
							};
							
							this.current = function() {
								if (!hasCurrent) {
									throw new InvalidOperationException();
								}
								return current;
							};			
							
							this.reset = function() {
								itemEnumerator.reset();
								hasCurrent = false;
							};		
						};
					};
				};
				func.prototype = Enumerable.prototype;
				return new func();
			}				
		};
	})();
	
	this.InvalidOperationException = InvalidOperationException;
	this.ArgumentOutOfRangeException = ArgumentOutOfRangeException;
	this.EqualityComparer = EqualityComparer;
	this.Comparer = Comparer;
	this.Enumerable = Enumerable;
}).call(jsinq);