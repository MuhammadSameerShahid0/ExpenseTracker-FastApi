from sqlalchemy import or_
from sqlalchemy.orm import Session
from Models.Table.Logging import Logging as LoggingModel
from Interfaces.ILoggingService import ILoggingService
from Schema.LoggingSchema import GetUserAuthLogsResponse, SelectedLogging


class LoggingService(ILoggingService):
    def __init__(self, db: Session):
        self.db = db

    def get_user_auth_logs(self, user_id: int, user_email: str):
        result = []
        logs = self.db.query(LoggingModel).filter(
            LoggingModel.user_id == user_id,
            LoggingModel.event_source.startswith("AuthService.Login")).all()

        for log in logs:
            response = GetUserAuthLogsResponse(
                email=user_email,
                message=log.message,
                ip_address=log.ip_address,
                datetime=log.created_at,
            )

            result.append(response)

        return result

    def return_selected_logging(self, user_id: int, user_email: str):
        result = []
        select_logs = (self.db.query(LoggingModel)
        .filter(
            LoggingModel.user_id == user_id,
            or_(
                LoggingModel.event_source.startswith("AuthService.Login"),
                LoggingModel.event_source.startswith("AuthService.RegisterCodeAndOTP"),
                LoggingModel.event_source.startswith("AuthService.LoginCodeAndOTP"),
                LoggingModel.event_source.startswith("AuthService.DeleteAccount"),
                LoggingModel.event_source.startswith("AuthService.Register"),
                LoggingModel.event_source.startswith("AuthService.ChangePassword"),
                LoggingModel.event_source.startswith("AuthService.UpdateProfile"),
                LoggingModel.event_source.startswith("ExpenseService.AddCategory"),
                LoggingModel.event_source.startswith("BudgetService.AddBudget"),
                LoggingModel.event_source.startswith("BudgetService.DeleteSetBudget"),
                LoggingModel.event_source.startswith("ExpenseService.EditExpenseList"),
                LoggingModel.event_source.startswith("BudgetService.EditBudgetAmount"),
                LoggingModel.event_source.startswith("ExpenseService.AddExpense"),
                LoggingModel.event_source.startswith("ExpenseService.DeleteExpenseListItem"),
                LoggingModel.event_source.startswith("AuthService.AccountReActive"),

            )
            ).all()
                       )

        for log in select_logs:
            log_source = log.event_source.split(".")[1]
            response = SelectedLogging(
                source = log_source,
                email=user_email,
                message=log.message,
                ip_address=log.ip_address,
                datetime=log.created_at,
            )
            result.append(response)
        return result