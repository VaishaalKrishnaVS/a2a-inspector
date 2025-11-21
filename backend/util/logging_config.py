import logging

# Flag to ensure basicConfig is only called once
_logging_configured = False


class LoggingConfig:
    """Configuration class for application logging."""

    @staticmethod
    def get_logger(name: str) -> logging.Logger:
        """
        Get a logger instance with configured logging.

        Args:
            name: Logger name (typically __name__)

        Returns:
            Configured logger instance
        """
        global _logging_configured

        if not _logging_configured:
            logging.basicConfig(
                level=logging.INFO,
                format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
                datefmt="%Y-%m-%d %H:%M:%S",
                force=True,  # Override any existing configuration
            )
            _logging_configured = True

        return logging.getLogger(name)
