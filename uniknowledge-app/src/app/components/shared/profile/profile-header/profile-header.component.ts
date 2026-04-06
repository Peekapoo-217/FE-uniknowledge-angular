import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
    selector: 'app-profile-header',
    standalone: true,
    imports: [CommonModule, RouterLink],
    templateUrl: './profile-header.component.html',
    styleUrls: ['./profile-header.component.scss']
})
export class ProfileHeaderComponent {
    username = input.required<string>();
    email = input.required<string>();
    fullName = input<string | undefined>(undefined);
    avatarUrl = input<string | undefined>(undefined);
    createdAt = input.required<Date>();
    showEditButton = input<boolean>(true);


}
