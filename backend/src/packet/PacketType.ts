export enum PacketType {
  // ===== Player related =====
  S2CConnectionAck = "s2c_connection_ack",
  S2CUsernameSet = "s2c_username_set",

  // ===== Lobby related =====
  S2CLobbyCreated = "s2c_lobby_created",
  S2CLobbyDestroyed = "s2c_lobby_destroyed",
  S2CLobbySettingsUpdated = "s2c_lobby_settings_updated",

  // ===== Game session related =====
  S2CUserJoinLobby = "s2c_user_join_lobby",
  S2CUserLeaveLobby = "s2c_user_leave_lobby",
  S2CToastNotification = "s2c_toast_notification",
  S2CGameSessionState = "s2c_game_session_state",

}
