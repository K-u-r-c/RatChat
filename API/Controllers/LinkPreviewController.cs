using API.Services;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers;

[ApiController]
[Route("api/link-preview")]
public class LinkPreviewController : ControllerBase
{
    private readonly ILinkPreviewService _linkPreviewService;
    private readonly ILogger<LinkPreviewController> _logger;

    public LinkPreviewController(
        ILinkPreviewService linkPreviewService,
        ILogger<LinkPreviewController> logger)
    {
        _linkPreviewService = linkPreviewService;
        _logger = logger;
    }

    [HttpGet]
    public async Task<IActionResult> GetPreview(
        [FromQuery] string url,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(url))
        {
            return BadRequest(new { error = "Query parameter 'url' is required." });
        }

        try
        {
            var preview = await _linkPreviewService.FetchAsync(url, cancellationToken);
            if (preview is null)
            {
                return NoContent();
            }

            return Ok(preview);
        }
        catch (ArgumentException ex)
        {
            _logger.LogDebug(ex, "Invalid preview request for {Url}", url);
            return BadRequest(new { error = ex.Message });
        }
    }
}
