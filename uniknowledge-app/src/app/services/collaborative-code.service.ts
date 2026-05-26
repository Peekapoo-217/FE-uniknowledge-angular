import { Injectable, inject, OnDestroy } from '@angular/core';
import { HubConnection, HubConnectionBuilder, HubConnectionState } from '@microsoft/signalr';
import { Subject, Observable } from 'rxjs';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';
import { UserPresence, RemoteCursor } from '../models/collab-code.model';

@Injectable()
export class CollaborativeCodeService implements OnDestroy {
  private authService = inject(AuthService);
  private hubConnection?: HubConnection;

  // RxJS Subjects as Streams
  private codeDeltaReceivedSubject = new Subject<any>();
  public codeDeltaReceived$: Observable<any> = this.codeDeltaReceivedSubject.asObservable();

  private userPresenceChangedSubject = new Subject<UserPresence[]>();
  public userPresenceChanged$: Observable<UserPresence[]> = this.userPresenceChangedSubject.asObservable();

  private remoteCursorMovedSubject = new Subject<RemoteCursor>();
  public remoteCursorMoved$: Observable<RemoteCursor> = this.remoteCursorMovedSubject.asObservable();

  async connect(roomId: string): Promise<void> {
    // If connection is already established, do nothing
    if (this.hubConnection?.state === HubConnectionState.Connected) {
      return;
    }

    const token = this.authService.getToken();
    if (!token) {
      throw new Error('Authentication token not available');
    }

    // Instantiate HubConnection securely pointing to /hubs/code with token auth
    this.hubConnection = new HubConnectionBuilder()
      .withUrl(`${environment.baseUrl}/hubs/code`, {
        accessTokenFactory: () => token
      })
      .withAutomaticReconnect({
        nextRetryDelayInMilliseconds: retryContext => {
          const delays = [1000, 2000, 5000, 10000];
          return delays[Math.min(retryContext.previousRetryCount, delays.length - 1)];
        }
      })
      .build();

    // Register Hub call handlers
    this.hubConnection.on('ReceiveCodeDelta', (deltas: any) => {
      this.codeDeltaReceivedSubject.next(deltas);
    });

    this.hubConnection.on('UserPresenceChanged', (presenceList: UserPresence[]) => {
      this.userPresenceChangedSubject.next(presenceList);
    });

    this.hubConnection.on('ReceiveCursorMoved', (cursor: RemoteCursor) => {
      this.remoteCursorMovedSubject.next(cursor);
    });

    this.hubConnection.onclose((error) => {
      if (error) {
        console.warn('SignalR collaborative hub connection closed with error:', error);
      }
    });

    try {
      await this.hubConnection.start();
      console.log('SignalR CollaborativeCodeHub connected successfully');
      
      // Join the collaborative room
      await this.hubConnection.invoke('JoinRoom', roomId);
    } catch (error) {
      console.error('Error starting connection or joining room in CollaborativeCodeHub:', error);
      throw error;
    }
  }

  async disconnect(roomId: string): Promise<void> {
    if (this.hubConnection) {
      try {
        if (this.hubConnection.state === HubConnectionState.Connected) {
          // Invoke LeaveRoom on the hub
          await this.hubConnection.invoke('LeaveRoom', roomId);
        }
      } catch (err) {
        console.error('Error leaving room during disconnection:', err);
      } finally {
        await this.hubConnection.stop();
        this.hubConnection = undefined;
        console.log('SignalR CollaborativeCodeHub disconnected successfully');
      }
    }
  }

  async sendCodeDelta(roomId: string, deltas: any): Promise<void> {
    if (this.hubConnection?.state !== HubConnectionState.Connected) {
      return;
    }

    try {
      await this.hubConnection.invoke('SendCodeDelta', roomId, deltas);
    } catch (error) {
      console.error('Error invoking SendCodeDelta on Hub:', error);
    }
  }

  async sendCursor(roomId: string, cursor: any): Promise<void> {
    if (this.hubConnection?.state !== HubConnectionState.Connected) {
      return;
    }

    try {
      await this.hubConnection.invoke('SendCursorPosition', roomId, cursor);
    } catch (error) {
      console.error('Error invoking SendCursorPosition on Hub:', error);
    }
  }

  isConnected(): boolean {
    return this.hubConnection?.state === HubConnectionState.Connected;
  }

  async ngOnDestroy(): Promise<void> {
    if (this.hubConnection) {
      try {
        await this.hubConnection.stop();
      } catch (err) {
        console.error('Error stopping hub connection in service ngOnDestroy:', err);
      } finally {
        this.hubConnection = undefined;
        console.log('SignalR CollaborativeCodeHub socket cleaned up via service OnDestroy');
      }
    }
    // Prevent RxJS Memory Leaks: Complete all subjects to release browser stream memory entirely
    this.codeDeltaReceivedSubject.complete();
    this.userPresenceChangedSubject.complete();
    this.remoteCursorMovedSubject.complete();
  }
}
