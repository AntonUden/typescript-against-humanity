const socket = io();

var gameConfig = null;
var activeGame = null;
var ready = false;
var myUUID = null;

var selectedCards = [];

var disconnected = false;

socket.on("message", function (message, content) {
	// This is to prevent the player from going into a weird invalid game state when the server restarts
	if(disconnected) {
		return;
	}

	//console.debug(message);
	//console.debug(content);

	switch (message) {
		case "message":
			handleMessage(content);
			break;

		case "state":
			handleGameState(content);
			break;

		case "game_list":
			handleGameList(content);
			break;

		case "round_start":
			handleRoundStart(content);
			break;

		case "client_settings":
			gameConfig = content;
			myUUID = gameConfig.uuid;
			ready = true;
			setupExpansions();
			break;

		case "cards_selected_success":
			toastr.success("Cards selected");
			updateSelectionNumbers();
			break;

		case "time_left":
			$("#time_left").text(content.time);
			break;

		case "voting_start":
			handleVotingStart(content);
			break;

		default:
			console.warn("invalid packet: " + message);
			break;
	}
});

socket.on("disconnect", () => {
	toastr.error("Please reload the page", "Disconnected");
	$("#disconnected_message_full").removeClass("d-none");
	disconnected = true;
});

function getDeck(name) {
	let result = null;

	gameConfig.deckCollections.forEach((deckCollection) => {
		deckCollection.decks.forEach((deck) => {
			if (deck.name == name) {
				result = deck;
			}
		});
	});

	return result;
}

function joinGame(uuid) {
	socket.send("join_game", {
		uuid: uuid
	});
}

function handleGameList(data) {
	if (!ready) {
		console.log("ignoring handleGameList() since we are not ready");
		return;
	}


	/* ===== Setup table rows ===== */
	let foundGames = [];

	$(".game-tr").each(function () {
		let uuid = $(this).data("game-id");

		foundGames.push(uuid);
	});

	//console.log(foundGames);

	for (let i = 0; i < data.games.length; i++) {
		let game = data.games[i];

		//console.log("foundGames.includes(game.uuid) " + game.uuid + " : " + foundGames.includes(game.uuid));

		if (foundGames.includes(game.uuid)) {
			foundGames.remove(game.uuid);
		} else {
			console.debug("Creating tr for game " + game.uuid);

			let newElement = $("#game_tr_template").clone();
			newElement.removeAttr("id");
			newElement.addClass("game-tr");
			newElement.attr("data-game-id", game.uuid);

			newElement.find(".td-game-name").text(game.name);

			newElement.find(".join-game-button").on("click", function () {
				let uuid = $(this).parent().parent().data("game-id");
				console.debug("Attempting to join game " + uuid);
				joinGame(uuid);
			});

			//console.log(newElement);

			$("#game_table_rows").prepend(newElement);
		}
	}

	$(".game-tr").each(function () {
		let uuid = $(this).data("game-id");

		if (foundGames.includes(uuid)) {
			$(this).remove();
		}
	});

	/* ===== Update rows ===== */
	for (let i = 0; i < data.games.length; i++) {
		let game = data.games[i];

		$(".game-tr").each(function () {
			let uuid = $(this).data("game-id");

			if (game.uuid == uuid) {
				$(this).find(".td-game-player-count").text(game.player_count + " / " + gameConfig.maxPlayersPerGame + " Players")

				let expansions = "";

				game.decks.forEach((deckName) => {
					let deck = getDeck(deckName);

					if (deck == null) {
						expansions += "null, ";
					} else {
						expansions += deck.displayName + ", ";
					}
				});

				if (expansions.length > 2) {
					expansions = expansions.substring(0, expansions.length - 2)
				}

				$(this).find(".td-game-expansions").text(expansions)
			}
		});
	}
}

function handleVotingStart(data) {
	console.log(data);
}

function handleRoundStart(data) {
	// Clear voting cards
	$("#voting_cards").html();

	// Reset and prepare for next round
	selectedCards = [];
	$(".selected-white-card").removeClass("selected-white-card");
	updateSelectionNumbers();
}

/* ===== This gets called when something in the game changes and the game needs to update ===== */
function handleGameState(data) {
	if (!ready) {
		console.log("ignoring handleGameState() since we are not ready");
		return;
	}


	if (data.active_game == null) {
		$("#game_browser").show();
		$("#game").hide();

		activeGame = null;
	} else {
		$("#game").show();
		$("#game_browser").hide();

		activeGame = data.active_game;

		if (activeGame.state == 0) {
			/* ===== Lobby data ===== */
			$("#waiting_lobby").show();
			$("#in_game").hide();

			if (activeGame.host == myUUID) {
				$("#host_options").show();
			} else {
				$("#host_options").hide();
			}

			$("#players_tbody").find(".lobby-player-tr").remove();
			for (let i = 0; i < activeGame.players.length; i++) {
				let player = activeGame.players[i];

				let newElement = $("#lobby_player_template").clone();
				newElement.removeAttr("id");
				newElement.addClass("lobby-player-tr");
				newElement.attr("data-player-id", player.uuid);

				newElement.find(".td-player-name").text(player.username);

				$("#players_tbody").append(newElement);
			}

			let expansions = "";

			activeGame.decks.forEach((deckName) => {
				let deck = getDeck(deckName);

				if (deck == null) {
					expansions += "null, ";
				} else {
					expansions += deck.displayName + ", ";
				}
			});

			if (expansions.length > 2) {
				expansions = expansions.substring(0, expansions.length - 2)
			}

			$("#game_expansions").text(expansions);
		} else {
			/* ===== In game ===== */

			/* ===== Black card ===== */
			$("#waiting_lobby").hide();
			$("#in_game").show();

			if (activeGame.black_card == null) {
				$("#black_card_pick").text("");
				$("#black_card_text").text("");
			} else {
				let blackCard = activeGame.black_card;

				$("#black_card_pick").text("pick " + blackCard.pick);
				$("#black_card_text").html(blackCard.text);
			}


			/* ===== Player list (ingame version) ===== */
			let foundPlayers = [];
			$(".ingame-player-tr").each(function () {
				foundPlayers.push($(this).data("uuid"));
			});

			//console.log(foundPlayers);

			activeGame.players.forEach((player) => {
				if (foundPlayers.includes(player.uuid)) {
					$(".ingame-player-tr").each(function () {
						if (player.uuid == $(this).data("uuid")) {
							$(this).find(".td-player-score").text(player.score);
						}
					});
				} else {
					let newElement = $("#ingame_player_template").clone();
					newElement.removeAttr("id");
					newElement.addClass("ingame-player-tr");
					newElement.attr("data-uuid", player.uuid);

					newElement.find(".card-czar").hide();
					newElement.find(".selecting-cards").hide();

					newElement.find(".player-name").text(player.username);
					newElement.find(".td-player-score").text(player.score);

					$("#game_players_tbody").append(newElement);
				}

				foundPlayers.remove(player.uuid);
			});

			foundPlayers.forEach((uuid) => {
				$(".ingame-player-tr").each(function () {
					if ($(this).data("uuid") == uuid) {
						$(this).remove();
					}
				});
			});

			$(".ingame-player-tr").each(function () {
				let uuid = $(this).data("uuid");
				if (uuid == activeGame.card_czar) {
					$(this).find(".card-czar").show();
					$(this).find(".selecting-cards").hide();
				} else {
					$(this).find(".card-czar").hide();
					if (activeGame.players.find(p => p.uuid == uuid).done) {
						$(this).find(".selecting-cards").hide();
					} else {
						$(this).find(".selecting-cards").show();
					}
				}
			});

			/* ===== Player hand state ===== */
			let isCardCzar = myUUID == activeGame.card_czar;

			let enableHand = true;

			// player is the card czar
			if (isCardCzar) {
				$("#you_are_card_czar").show();
				enableHand = false;
			} else {
				$("#you_are_card_czar").hide();
			}

			// player has played their cards and is waiting for the other players
			if (activeGame.phase == 0 && !isCardCzar && activeGame.players.find(p => p.uuid == myUUID).done) {
				$("#wait_for_other_players").show();
				enableHand = false;
			} else {
				$("#wait_for_other_players").hide();
			}

			// player is waiting for the card czar to pick
			if (activeGame.phase == 1 && !isCardCzar) {
				$("#wait_for_card_czar").show();
				enableHand = false;
			} else {
				$("#wait_for_card_czar").hide();
			}

			// enable / disable hand depending on hame state
			if (enableHand) {
				$("#player_hand").removeClass("disabled-content");
			} else {
				$("#player_hand").addClass("disabled-content");
			}

			/* ===== Player hand cards ===== */
			let handCards = [];

			$(".player-hand-card").each(function () {
				handCards.push(b64_to_utf8($(this).data("content")));
			});

			//console.log(handCards);

			activeGame.hand.forEach((card) => {
				if (!handCards.includes(card)) {
					let newHtml = $("#white_card_template").clone();

					newHtml.removeAttr("id");
					newHtml.attr("data-content", utf8_to_b64(card));
					newHtml.addClass("player-hand-card");

					newHtml.find(".selected-card-number").hide();
					newHtml.find(".cord-text-content").html(card);

					newHtml.on("click", function () {
						if ($(this).hasClass("selected-white-card")) {
							$(this).removeClass("selected-white-card");
							selectedCards.remove(b64_to_utf8($(this).data("content")));
							updateSelectionNumbers();
						} else {
							if (activeGame.black_card == null) {
								return;
							}

							if (selectedCards.length >= activeGame.black_card.pick) {
								toastr.warning("Click on the selected cards to unselect them", "You have selected the maximum amount of cards");
								return;
							}

							$(this).addClass("selected-white-card");
							selectedCards.push(b64_to_utf8($(this).data("content")));
							updateSelectionNumbers();
						}


					});

					$("#player_hand").append(newHtml);
				}

				handCards.remove(card);
			});


			$(".player-hand-card").each(function () {
				if (handCards.includes(b64_to_utf8($(this).data("content")))) {
					$(this).remove();
				}
			});
		}
	}
}

// also enables / disables the confirm selection button
function updateSelectionNumbers() {
	if (activeGame != null) {
		if (activeGame.black_card != null) {
			let select = activeGame.black_card.pick;

			$("#player_hand").find(".selected-card-number").hide();
			if (select > 1) {
				for (let i = 0; i < selectedCards.length; i++) {
					let b64 = utf8_to_b64(selectedCards[i]);
					//console.log("target: " + b64);
					$("#player_hand").find(".player-hand-card").each(function () {
						//console.log($(this).data("content"));
						if ($(this).data("content") == b64) {
							$(this).find(".selected-card-number").text(i + 1);
							$(this).find(".selected-card-number").show();
						}
					});
				}
			}

			console.log("done: " + activeGame.players.find(p => p.uuid == myUUID).done);

			if (selectedCards.length == select && game.card_czar != myUUID && !activeGame.players.find(p => p.uuid == myUUID).done) {
				$("#btn_confirm_selection").attr("disabled", false);
			} else {
				$("#btn_confirm_selection").attr("disabled", true);
			}
		}
	}
}

$(function () {
	$("#game").hide();
	$("#you_are_card_czar").hide();
	$("#btn_confirm_selection").attr("disabled", true);

	$("#btn_createGame").on("click", function () {
		let gameName = $("#tbx_careateGameName").val();

		if (gameName.length == 0) {
			toastr.error("Please provide a name for the game");
			return;
		}

		if (gameName.length > gameConfig.maxGameNameLength) {
			toastr.error("The name cant be over " + gameConfig.maxGameNameLength + " characters");
			return;
		}

		socket.send("create_game", {
			game_name: gameName
		});
	});

	$(".btn_leaveGame").on("click", function () {
		socket.send("leave_game", {});
	});

	$("#btn_select_expansions").on("click", function () {
		updateExpansionSelector();
		$("#selectExpansionsModal").modal("show");
	});

	$("#btn_save_expansions").on("click", function () {
		$("#selectExpansionsModal").modal("hide");
		saveExpansions();
	});

	$("#btn_start_game").on("click", function () {
		socket.send("start_game", {});
	});

	$("#btn_confirm_selection").on("click", function () {
		socket.send("select_cards", {
			selected_cards: selectedCards
		});
	});

	$(".hide-until-loaded").removeClass(".hide-until-loaded");
});

function useAllExpansions() {
	$(".cbx-expansion-selection").prop("checked", true);
}

function setupExpansions() {
	$("#expansions").text("");
	gameConfig.deckCollections.forEach((deckCollection) => {
		//console.log(deckCollection);

		let collectionHtml = $("#deck_collection_template").clone();
		collectionHtml.removeAttr("id");
		collectionHtml.find(".collection-name").text(deckCollection.displayName);
		collectionHtml.find(".collection-description").html(deckCollection.description);
		$("#expansions").append(collectionHtml);

		deckCollection.decks.forEach((deck) => {
			let deckId = "cbx_deck-" + deck.name;

			let title = deck.blackCards.length + " black cards " + deck.whiteCards.length + " white cards";

			let newElement = $("#expanstion_template").clone();
			newElement.removeAttr("id");
			newElement.attr("title", title);
			newElement.find(".form-check-input").attr("id", deckId);
			newElement.find(".form-check-input").addClass("cbx-expansion-selection");
			newElement.find(".form-check-input").attr("data-deck-name", deck.name);
			newElement.find(".form-check-label").attr("for", deckId);
			newElement.find(".form-check-label").text(deck.displayName);

			$("#expansions").append(newElement);
		});
	});
}

function updateExpansionSelector() {
	if (activeGame == null) {
		$(".cbx-expansion-selection").prop("checked", false);
	} else {
		activeGame.decks.forEach((deck) => {
			$(".cbx-expansion-selection[data-deck-name=\"" + deck + "\"]").prop("checked", true);
		})
	}
}

function saveExpansions() {
	let expansions = {};

	$(".cbx-expansion-selection").each(function () {
		let name = $(this).data("deck-name");

		expansions[name] = $(this).is(':checked');
	});

	console.debug(expansions);

	socket.send("set_game_expanstions", {
		expansions: expansions
	});
}