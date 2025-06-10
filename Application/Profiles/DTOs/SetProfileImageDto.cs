namespace Application.Profiles.DTOs;

public class SetProfileImageDto
{
    public required string MediaUrl { get; set; }
    public required string PublicId { get; set; }

    /// <summary>
    /// <para>
    /// "profile" - for profile picture<br/>
    /// "banner"  - for banner image
    /// </para>
    /// </summary>
    public required string ImageType { get; set; }
}
