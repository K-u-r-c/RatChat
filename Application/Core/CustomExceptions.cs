namespace Application.Core;

public class ChatRoomNotFoundException(string message) : Exception(message) { }

public class UserNotFoundException(string message) : Exception(message) { }

public class ChatRoomRoleNotFoundException(string message) : Exception(message) { }

public class ChatRoomPermissionsNotFoundException(string message) : Exception(message) { }

public class ChatRoomRoleAlreadyExistsException(string message) : Exception(message) { }

public class CannotDeleteDefaultRoleException(string message) : Exception(message) { }

public class UserAlreadyHasRoleException(string message) : Exception(message) { }

public class ContextSaveOperationFailedException(string message) : Exception(message) { }

public class ChatRoomMemberNotFoundException(string message) : Exception(message) { }

public class UserDoesNotHaveRoleException(string message) : Exception(message) { }

